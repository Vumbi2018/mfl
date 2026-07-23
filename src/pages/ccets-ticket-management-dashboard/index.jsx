import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { SidebarProvider } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import IntegrationHealthMonitor from '../../components/navigation/IntegrationHealthMonitor';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import CascadeLocationFilter from './components/CascadeLocationFilter';
import TicketQueueTable from './components/TicketQueueTable';
import InteractiveTicketMap from './components/InteractiveTicketMap';
import AdvancedFilterPanel from './components/AdvancedFilterPanel';
import BulkAssignmentModal from './components/BulkAssignmentModal';
import TicketDetailModal from './components/TicketDetailModal';
import NotificationBadge from './components/NotificationBadge';

const CCETSTicketManagementDashboard = () => {
  const [selectedLocation, setSelectedLocation] = useState({
    region: null,
    province: null,
    district: null,
    facility: null
  });
  const [filters, setFilters] = useState({
    equipmentType: 'all',
    faultCategory: 'all',
    priority: 'all',
    status: 'all',
    technicianAvailability: 'all',
    escalationStatus: 'all'
  });
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'split'
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'new', count: 5 },
    { id: 2, type: 'urgent', count: 2 }
  ]);

  // State for tickets
  const [tickets, setTickets] = useState([]);

  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        const mappedTickets = response.data.map(t => ({
          id: t.id,
          referenceNumber: t.reference_number,
          facility: t.facility_name || 'Unknown Facility',
          equipment: t.equipment_name || 'Unknown Equipment',
          equipmentType: t.equipment_type || 'General',
          faultDescription: t.fault_description,
          priority: t.priority,
          status: t.status,
          slaTimer: '23h 15m', // Calculate real SLA later
          slaStatus: t.sla_status || 'normal',
          assignedTechnician: t.assigned_technician,
          createdDate: new Date(t.created_at).toLocaleString(),
          location: {
            lat: parseFloat(t.latitude || -6.314993),
            lng: parseFloat(t.longitude || 143.95555)
          },
          region: t.region || 'Unknown',
          province: t.province || 'Unknown',
          district: t.district || 'Unknown'
        }));
        setTickets(mappedTickets);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
      }
    };
    fetchTickets();
  }, []);

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleBulkAssign = (assignmentData) => {
    console.log('Bulk assigning tickets:', selectedTickets, 'to', assignmentData);
    setShowBulkAssign(false);
    setSelectedTickets([]);
  };

  const handleStatusUpdate = (ticketId, newStatus) => {
    setTickets(tickets?.map(t =>
      t?.id === ticketId ? { ...t, status: newStatus } : t
    ));
  };

  const getSLAColor = (slaStatus) => {
    switch (slaStatus) {
      case 'critical': return 'text-error';
      case 'warning': return 'text-warning';
      default: return 'text-success';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <MobileMenuButton />

        <div className="main-content flex-1 flex flex-col">
          {/* Header with Real-time Notifications */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="Ticket" size={20} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">CCETS Ticket Management</h1>
                  <p className="text-sm text-muted-foreground">Cold Chain Equipment Tracking System - Provincial Command Center</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <NotificationBadge notifications={notifications} />
                <IntegrationHealthMonitor />
                <Button
                  variant="outline"
                  iconName="Download"
                  iconPosition="left"
                  onClick={() => console.log('Export maintenance reports')}
                >
                  Export Reports
                </Button>
                <Button
                  variant="default"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={() => console.log('Create new ticket')}
                >
                  New Ticket
                </Button>
              </div>
            </div>

            {/* Cascade Location Filters */}
            <CascadeLocationFilter
              selectedLocation={selectedLocation}
              onLocationChange={handleLocationChange}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Advanced Filter Panel */}
            <AdvancedFilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
            />

            {/* Ticket Queue Table (65%) */}
            <div className="flex-1 flex flex-col p-4" style={{ width: '65%' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Ticket Queue</h2>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {tickets?.length} Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName={viewMode === 'table' ? 'LayoutGrid' : 'List'}
                    onClick={() => setViewMode(viewMode === 'table' ? 'split' : 'table')}
                  >
                    {viewMode === 'table' ? 'Split View' : 'Table View'}
                  </Button>
                  {selectedTickets?.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      iconName="Users"
                      onClick={() => setShowBulkAssign(true)}
                    >
                      Bulk Assign ({selectedTickets?.length})
                    </Button>
                  )}
                </div>
              </div>

              <TicketQueueTable
                tickets={tickets}
                selectedTickets={selectedTickets}
                onTicketSelect={handleTicketSelect}
                onSelectionChange={setSelectedTickets}
                onStatusUpdate={handleStatusUpdate}
                filters={filters}
                selectedLocation={selectedLocation}
              />
            </div>

            {/* Interactive Map Panel (35%) */}
            <div className="border-l border-border p-4" style={{ width: '35%' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Facility Distribution</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Maximize2"
                  onClick={() => console.log('Expand map')}
                />
              </div>
              <InteractiveTicketMap
                tickets={tickets}
                selectedTicket={selectedTicket}
                onTicketSelect={handleTicketSelect}
                selectedLocation={selectedLocation}
              />

              {/* Real-time Collaboration Indicators */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Users" size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">3 team members active</span>
                </div>
              </div>

              {/* Offline Sync Status */}
              <div className="mt-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Wifi" size={16} className="text-success" />
                  <span className="text-success">Online - All synced</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Helper */}
          <div className="bg-card border-t border-border px-4 py-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl</kbd> +
                <kbd className="px-2 py-1 bg-muted rounded">N</kbd> New Ticket
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl</kbd> +
                <kbd className="px-2 py-1 bg-muted rounded">F</kbd> Filter
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl</kbd> +
                <kbd className="px-2 py-1 bg-muted rounded">A</kbd> Select All
              </span>
            </div>
          </div>
        </div>

        <WorkflowStatusIndicator />

        {/* Modals */}
        {showBulkAssign && (
          <BulkAssignmentModal
            isOpen={showBulkAssign}
            onClose={() => setShowBulkAssign(false)}
            selectedTickets={selectedTickets}
            onAssign={handleBulkAssign}
          />
        )}

        {selectedTicket && (
          <TicketDetailModal
            isOpen={!!selectedTicket}
            onClose={() => setSelectedTicket(null)}
            ticket={selectedTicket}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default CCETSTicketManagementDashboard;