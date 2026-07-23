import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Wrench, Clock, CheckCircle, AlertTriangle, Package, Filter, Map as MapIcon } from 'lucide-react';
import TechnicianTicketCard from './components/TechnicianTicketCard';
import TechnicianMapView from './components/TechnicianMapView';
import OfflineSyncIndicator from '../ccets-ticket-management/components/OfflineSyncIndicator';

const CCETSTechnicianDashboard = () => {
  const [view, setView] = useState('list'); // 'list' or 'map'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock technician data
  const technicianInfo = {
    name: 'Peter Waima',
    role: 'Field Technician',
    region: 'Momase',
    province: 'Morobe',
    district: 'Lae',
    phone: '+675 7234 5678'
  };

  // Mock assigned tickets
  const mockAssignedTickets = [
    {
      id: 2,
      referenceNumber: 'MOR-LAE-LAE-GEN-20251214-0045',
      facility: 'Angau Memorial Hospital',
      facilityLocation: { lat: -6.7264, lng: 147.0016 },
      equipment: 'Cold Room CR-1000',
      equipmentId: 'CR-1000-2022-008',
      faultDescription: 'Door seal damaged, cold air leaking',
      priority: 'medium',
      status: 'assigned',
      createdAt: '2025-12-14T14:20:00',
      assignedAt: '2025-12-14T16:45:00',
      distance: '2.5 km',
      estimatedTime: '15 mins'
    },
    {
      id: 6,
      referenceNumber: 'MOR-LAE-FIN-HC-20251215-0003',
      facility: 'Finschhafen Health Centre',
      facilityLocation: { lat: -6.6025, lng: 147.8617 },
      equipment: 'Vaccine Refrigerator VR-300',
      equipmentId: 'VR-300-2024-012',
      faultDescription: 'Thermostat malfunction, inconsistent temperature',
      priority: 'high',
      status: 'assigned',
      createdAt: '2025-12-15T06:30:00',
      assignedAt: '2025-12-15T08:00:00',
      distance: '95 km',
      estimatedTime: '2 hours'
    },
    {
      id: 7,
      referenceNumber: 'MOR-LAE-LAE-CLN-20251213-0078',
      facility: 'Top Town Clinic',
      facilityLocation: { lat: -6.7155, lng: 146.9928 },
      equipment: 'Ice-Lined Refrigerator ILR-150',
      equipmentId: 'ILR-150-2023-045',
      faultDescription: 'Power cord damaged, needs replacement',
      priority: 'low',
      status: 'in_progress',
      createdAt: '2025-12-13T11:00:00',
      assignedAt: '2025-12-13T14:30:00',
      startedAt: '2025-12-15T07:45:00',
      distance: '1.8 km',
      estimatedTime: '10 mins'
    }
  ];

  useEffect(() => {
    // Load tickets from localStorage
    const storedTickets = localStorage.getItem('technician_tickets');
    if (storedTickets) {
      setAssignedTickets(JSON.parse(storedTickets));
    } else {
      setAssignedTickets(mockAssignedTickets);
      localStorage.setItem('technician_tickets', JSON.stringify(mockAssignedTickets));
    }

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredTickets = assignedTickets?.filter(ticket => {
    if (filterPriority !== 'all' && ticket?.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && ticket?.status !== filterStatus) return false;
    return true;
  });

  const activeTickets = assignedTickets?.filter(t => ['assigned', 'in_progress']?.includes(t?.status));
  const completedToday = assignedTickets?.filter(t => 
    t?.status === 'resolved' && new Date(t.resolvedAt ||'')?.toDateString() === new Date()?.toDateString()
  )?.length;

  const handleTicketUpdate = (ticketId, updates) => {
    const updatedTickets = assignedTickets?.map(ticket => 
      ticket?.id === ticketId ? { ...ticket, ...updates } : ticket
    );
    setAssignedTickets(updatedTickets);
    localStorage.setItem('technician_tickets', JSON.stringify(updatedTickets));

    // If offline, store in pending actions
    if (!isOnline) {
      const pendingActions = JSON.parse(localStorage.getItem('ccets_pending_actions') || '[]');
      pendingActions?.push({ 
        type: 'update_ticket', 
        ticketId, 
        updates,
        timestamp: new Date()?.toISOString()
      });
      localStorage.setItem('ccets_pending_actions', JSON.stringify(pendingActions));
    }
  };

  return (
    <>
      <Helmet>
        <title>Technician Dashboard - CCETS</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Wrench className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{technicianInfo?.name}</h1>
                  <p className="text-blue-100">{technicianInfo?.role} • {technicianInfo?.district}, {technicianInfo?.province}</p>
                </div>
              </div>
              <OfflineSyncIndicator isOnline={isOnline} />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Active Tickets</p>
                    <p className="text-3xl font-bold">{activeTickets?.length}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-blue-200 opacity-50" />
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Completed Today</p>
                    <p className="text-3xl font-bold">{completedToday}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-blue-200 opacity-50" />
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">High Priority</p>
                    <p className="text-3xl font-bold">
                      {assignedTickets?.filter(t => t?.priority === 'high' && ['assigned', 'in_progress']?.includes(t?.status))?.length}
                    </p>
                  </div>
                  <Package className="w-10 h-10 text-blue-200 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* View Toggle and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    view === 'list' ?'bg-blue-600 text-white' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    view === 'map' ?'bg-blue-600 text-white' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Map View</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e?.target?.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e?.target?.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {view === 'list' ? (
            <div className="space-y-4">
              {filteredTickets?.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
                  <p className="text-gray-500">
                    {filterPriority !== 'all' || filterStatus !== 'all' ?'Try adjusting your filters' :'You have no assigned tickets at the moment'}
                  </p>
                </div>
              ) : (
                filteredTickets?.map(ticket => (
                  <TechnicianTicketCard
                    key={ticket?.id}
                    ticket={ticket}
                    onUpdate={handleTicketUpdate}
                    isOnline={isOnline}
                  />
                ))
              )}
            </div>
          ) : (
            <TechnicianMapView 
              tickets={filteredTickets}
              technicianLocation={{ lat: -6.7264, lng: 147.0016 }}
              onTicketSelect={(ticket) => {
                // Handle ticket selection from map
                console.log('Selected ticket:', ticket);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CCETSTechnicianDashboard;