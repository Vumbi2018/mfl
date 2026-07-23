import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Ticket, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Users,
  RefreshCw,
  Filter,
  Download,
  Plus,
  Search
} from 'lucide-react';
import TicketCreationModal from './components/TicketCreationModal';
import TicketDetailModal from './components/TicketDetailModal';
import TicketStatusCard from './components/TicketStatusCard';
import LocationFilter from './components/LocationFilter';
import OfflineSyncIndicator from './components/OfflineSyncIndicator';

const CCETSTicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState({
    region: 'all',
    province: 'all',
    district: 'all',
    facility: 'all'
  });

  // PNG Administrative Structure
  const pngRegions = {
    highlands: {
      name: 'Highlands',
      code: 'HGH',
      provinces: {
        western_highlands: { name: 'Western Highlands', code: 'WHP', districts: ['Hagen', 'Mul-Baiyer'] },
        southern_highlands: { name: 'Southern Highlands', code: 'SHP', districts: ['Mendi', 'Tari-Pori'] },
        enga: { name: 'Enga', code: 'ENG', districts: ['Wabag', 'Kandep'] },
        hela: { name: 'Hela', code: 'HLA', districts: ['Tari', 'Komo-Margarima'] },
        chimbu: { name: 'Chimbu', code: 'CHB', districts: ['Kundiawa', 'Gumine'] },
        eastern_highlands: { name: 'Eastern Highlands', code: 'EHP', districts: ['Goroka', 'Henganofi'] }
      }
    },
    momase: {
      name: 'Momase',
      code: 'MOM',
      provinces: {
        morobe: { name: 'Morobe', code: 'MOR', districts: ['Lae', 'Finschhafen', 'Huon Gulf'] },
        madang: { name: 'Madang', code: 'MAD', districts: ['Madang', 'Bogia', 'Rai Coast'] },
        east_sepik: { name: 'East Sepik', code: 'ESP', districts: ['Wewak', 'Angoram', 'Maprik'] },
        sandaun: { name: 'Sandaun', code: 'SAN', districts: ['Vanimo', 'Aitape-Lumi', 'Telefomin'] }
      }
    },
    papua: {
      name: 'Papua',
      code: 'PAP',
      provinces: {
        central: { name: 'Central', code: 'CPP', districts: ['Port Moresby', 'Abau', 'Kairuku-Hiri'] },
        gulf: { name: 'Gulf', code: 'GLP', districts: ['Kerema', 'Kikori'] },
        milne_bay: { name: 'Milne Bay', code: 'MBA', districts: ['Alotau', 'Samarai-Murua'] },
        northern: { name: 'Northern (Oro)', code: 'NPP', districts: ['Popondetta', 'Sohe'] },
        western: { name: 'Western', code: 'WPP', districts: ['Daru', 'Middle Fly', 'South Fly'] }
      }
    },
    islands: {
      name: 'Islands',
      code: 'ISL',
      provinces: {
        new_ireland: { name: 'New Ireland', code: 'NIK', districts: ['Kavieng', 'Namatanai'] },
        east_new_britain: { name: 'East New Britain', code: 'ENB', districts: ['Kokopo', 'Gazelle', 'Pomio'] },
        west_new_britain: { name: 'West New Britain', code: 'WNB', districts: ['Kimbe', 'Kandrian-Gloucester'] },
        manus: { name: 'Manus', code: 'MAN', districts: ['Lorengau', 'Manus'] },
        bougainville: { name: 'Autonomous Region of Bougainville', code: 'ARB', districts: ['Buka', 'Central Bougainville', 'South Bougainville'] }
      }
    }
  };

  // Mock ticket data with PNG locations
  const mockTickets = [
    {
      id: 1,
      referenceNumber: 'WHP-HAG-MTH-GEN-20251215-0001',
      region: 'highlands',
      province: 'western_highlands',
      district: 'Hagen',
      facility: 'Mount Hagen General Hospital',
      equipment: 'Vaccine Refrigerator VR-450',
      equipmentId: 'VR-450-2023-001',
      faultDescription: 'Temperature fluctuation detected, not maintaining 2-8°C range',
      priority: 'high',
      status: 'new',
      createdAt: '2025-12-15T08:30:00',
      createdBy: 'Dr. John Koi',
      assignedTo: null,
      lastUpdated: '2025-12-15T08:30:00',
      history: [
        { action: 'created', timestamp: '2025-12-15T08:30:00', user: 'Dr. John Koi', details: 'Ticket created' }
      ]
    },
    {
      id: 2,
      referenceNumber: 'MOR-LAE-LAE-GEN-20251214-0045',
      region: 'momase',
      province: 'morobe',
      district: 'Lae',
      facility: 'Angau Memorial Hospital',
      equipment: 'Cold Room CR-1000',
      equipmentId: 'CR-1000-2022-008',
      faultDescription: 'Door seal damaged, cold air leaking',
      priority: 'medium',
      status: 'assigned',
      createdAt: '2025-12-14T14:20:00',
      createdBy: 'Sister Mary Tau',
      assignedTo: 'Peter Waima (Technician)',
      lastUpdated: '2025-12-14T16:45:00',
      history: [
        { action: 'created', timestamp: '2025-12-14T14:20:00', user: 'Sister Mary Tau', details: 'Ticket created' },
        { action: 'assigned', timestamp: '2025-12-14T16:45:00', user: 'Provincial Manager', details: 'Assigned to Peter Waima' }
      ]
    },
    {
      id: 3,
      referenceNumber: 'CPP-POM-POM-CLN-20251213-0089',
      region: 'papua',
      province: 'central',
      district: 'Port Moresby',
      facility: 'Port Moresby General Clinic',
      equipment: 'Freezer FZ-300',
      equipmentId: 'FZ-300-2023-015',
      faultDescription: 'Compressor making unusual noise, may need replacement',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2025-12-13T09:15:00',
      createdBy: 'Nurse Linda Kila',
      assignedTo: 'James Pato (Technician)',
      lastUpdated: '2025-12-15T07:30:00',
      partsRequested: true,
      history: [
        { action: 'created', timestamp: '2025-12-13T09:15:00', user: 'Nurse Linda Kila', details: 'Ticket created' },
        { action: 'assigned', timestamp: '2025-12-13T11:00:00', user: 'Provincial Manager', details: 'Assigned to James Pato' },
        { action: 'started', timestamp: '2025-12-14T08:00:00', user: 'James Pato', details: 'Started work' },
        { action: 'parts_requested', timestamp: '2025-12-15T07:30:00', user: 'James Pato', details: 'Requested compressor replacement' }
      ]
    },
    {
      id: 4,
      referenceNumber: 'ENB-KOK-GAZ-HC-20251210-0012',
      region: 'islands',
      province: 'east_new_britain',
      district: 'Kokopo',
      facility: 'Gazelle Health Centre',
      equipment: 'Vaccine Carrier VC-50',
      equipmentId: 'VC-50-2024-003',
      faultDescription: 'Lid hinge broken, cannot secure cold chain during transport',
      priority: 'low',
      status: 'resolved',
      createdAt: '2025-12-10T10:00:00',
      createdBy: 'Community Health Worker Tom',
      assignedTo: 'Michael Toka (Technician)',
      resolvedAt: '2025-12-12T15:30:00',
      resolution: 'Replaced hinge mechanism with spare part',
      lastUpdated: '2025-12-12T15:30:00',
      history: [
        { action: 'created', timestamp: '2025-12-10T10:00:00', user: 'CHW Tom', details: 'Ticket created' },
        { action: 'assigned', timestamp: '2025-12-10T13:00:00', user: 'Provincial Manager', details: 'Assigned to Michael Toka' },
        { action: 'started', timestamp: '2025-12-11T09:00:00', user: 'Michael Toka', details: 'Started work' },
        { action: 'resolved', timestamp: '2025-12-12T15:30:00', user: 'Michael Toka', details: 'Replaced hinge, tested functionality' }
      ]
    },
    {
      id: 5,
      referenceNumber: 'ESP-WEW-WEW-HP-20251212-0034',
      region: 'momase',
      province: 'east_sepik',
      district: 'Wewak',
      facility: 'Wewak Provincial Hospital',
      equipment: 'Ice-Lined Refrigerator ILR-200',
      equipmentId: 'ILR-200-2023-022',
      faultDescription: 'Power supply issue, intermittent operation',
      priority: 'high',
      status: 'escalated',
      createdAt: '2025-12-12T07:45:00',
      createdBy: 'Dr. Sarah Wambi',
      assignedTo: 'David Kaupa (Technician)',
      escalatedTo: 'National Engineer',
      escalationReason: 'Electrical wiring issue requires specialist assessment',
      lastUpdated: '2025-12-14T16:00:00',
      history: [
        { action: 'created', timestamp: '2025-12-12T07:45:00', user: 'Dr. Sarah Wambi', details: 'Ticket created' },
        { action: 'assigned', timestamp: '2025-12-12T10:00:00', user: 'Provincial Manager', details: 'Assigned to David Kaupa' },
        { action: 'started', timestamp: '2025-12-13T08:30:00', user: 'David Kaupa', details: 'Started inspection' },
        { action: 'escalated', timestamp: '2025-12-14T16:00:00', user: 'David Kaupa', details: 'Escalated - requires electrical specialist' }
      ]
    }
  ];

  useEffect(() => {
    // Load tickets from localStorage (offline-first)
    const storedTickets = localStorage.getItem('ccets_tickets');
    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    } else {
      setTickets(mockTickets);
      localStorage.setItem('ccets_tickets', JSON.stringify(mockTickets));
    }

    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...tickets];

    // Search filter
    if (searchQuery) {
      filtered = filtered?.filter(ticket => 
        ticket?.referenceNumber?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        ticket?.facility?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        ticket?.equipment?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        ticket?.faultDescription?.toLowerCase()?.includes(searchQuery?.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered?.filter(ticket => ticket?.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered?.filter(ticket => ticket?.priority === priorityFilter);
    }

    // Location filter
    if (locationFilter?.region !== 'all') {
      filtered = filtered?.filter(ticket => ticket?.region === locationFilter?.region);
    }
    if (locationFilter?.province !== 'all') {
      filtered = filtered?.filter(ticket => ticket?.province === locationFilter?.province);
    }
    if (locationFilter?.district !== 'all') {
      filtered = filtered?.filter(ticket => ticket?.district === locationFilter?.district);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter, priorityFilter, locationFilter]);

  const syncOfflineData = () => {
    // Sync pending offline actions
    const pendingActions = JSON.parse(localStorage.getItem('ccets_pending_actions') || '[]');
    if (pendingActions?.length > 0) {
      console.log('Syncing offline data...', pendingActions);
      // In production, POST to backend API
      // After successful sync, clear pending actions
      localStorage.removeItem('ccets_pending_actions');
    }
  };

  const getStatusStats = () => {
    return {
      new: tickets?.filter(t => t?.status === 'new')?.length,
      assigned: tickets?.filter(t => t?.status === 'assigned')?.length,
      in_progress: tickets?.filter(t => t?.status === 'in_progress')?.length,
      escalated: tickets?.filter(t => t?.status === 'escalated')?.length,
      resolved: tickets?.filter(t => t?.status === 'resolved')?.length,
      closed: tickets?.filter(t => t?.status === 'closed')?.length
    };
  };

  const getPriorityStats = () => {
    return {
      high: tickets?.filter(t => t?.priority === 'high' && !['resolved', 'closed']?.includes(t?.status))?.length,
      medium: tickets?.filter(t => t?.priority === 'medium' && !['resolved', 'closed']?.includes(t?.status))?.length,
      low: tickets?.filter(t => t?.priority === 'low' && !['resolved', 'closed']?.includes(t?.status))?.length
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-red-500',
      assigned: 'bg-orange-500',
      in_progress: 'bg-amber-500',
      escalated: 'bg-purple-500',
      resolved: 'bg-green-500',
      closed: 'bg-gray-500'
    };
    return colors?.[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-orange-600 bg-orange-50',
      low: 'text-blue-600 bg-blue-50'
    };
    return colors?.[priority] || 'text-gray-600 bg-gray-50';
  };

  const statusStats = getStatusStats();
  const priorityStats = getPriorityStats();

  const handleCreateTicket = (ticketData) => {
    const newTicket = {
      ...ticketData,
      id: tickets?.length + 1,
      status: 'new',
      createdAt: new Date()?.toISOString(),
      lastUpdated: new Date()?.toISOString(),
      history: [{
        action: 'created',
        timestamp: new Date()?.toISOString(),
        user: 'Current User',
        details: 'Ticket created'
      }]
    };

    const updatedTickets = [...tickets, newTicket];
    setTickets(updatedTickets);
    localStorage.setItem('ccets_tickets', JSON.stringify(updatedTickets));

    // If offline, store in pending actions
    if (!isOnline) {
      const pendingActions = JSON.parse(localStorage.getItem('ccets_pending_actions') || '[]');
      pendingActions?.push({ type: 'create_ticket', data: newTicket });
      localStorage.setItem('ccets_pending_actions', JSON.stringify(pendingActions));
    }

    setIsCreateModalOpen(false);
  };

  const handleExport = () => {
    const csvContent = [
      ['Reference', 'Region', 'Province', 'District', 'Facility', 'Equipment', 'Priority', 'Status', 'Created', 'Assigned To']?.join(','),
      ...filteredTickets?.map(t => [
        t?.referenceNumber,
        pngRegions?.[t?.region]?.name || t?.region,
        pngRegions?.[t?.region]?.provinces?.[t?.province]?.name || t?.province,
        t?.district,
        t?.facility,
        t?.equipment,
        t?.priority,
        t?.status,
        new Date(t.createdAt)?.toLocaleDateString(),
        t?.assignedTo || 'Unassigned'
      ]?.join(','))
    ]?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ccets_tickets_${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    a?.click();
  };

  return (
    <>
      <Helmet>
        <title>CCETS Ticket Management - National HFR Platform</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Ticket className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cold Chain Equipment Tracking</h1>
                  <p className="text-sm text-gray-500">Papua New Guinea National System</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <OfflineSyncIndicator isOnline={isOnline} />
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <TicketStatusCard
              title="New"
              count={statusStats?.new}
              icon={AlertTriangle}
              color="red"
              onClick={() => setStatusFilter('new')}
            />
            <TicketStatusCard
              title="Assigned"
              count={statusStats?.assigned}
              icon={Users}
              color="orange"
              onClick={() => setStatusFilter('assigned')}
            />
            <TicketStatusCard
              title="In Progress"
              count={statusStats?.in_progress}
              icon={RefreshCw}
              color="amber"
              onClick={() => setStatusFilter('in_progress')}
            />
            <TicketStatusCard
              title="Escalated"
              count={statusStats?.escalated}
              icon={AlertTriangle}
              color="purple"
              onClick={() => setStatusFilter('escalated')}
            />
            <TicketStatusCard
              title="Resolved"
              count={statusStats?.resolved}
              icon={CheckCircle}
              color="green"
              onClick={() => setStatusFilter('resolved')}
            />
            <TicketStatusCard
              title="Closed"
              count={statusStats?.closed}
              icon={XCircle}
              color="gray"
              onClick={() => setStatusFilter('closed')}
            />
          </div>

          {/* Priority Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Priority Active</p>
                  <p className="text-2xl font-bold text-red-600">{priorityStats?.high}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Medium Priority Active</p>
                  <p className="text-2xl font-bold text-orange-600">{priorityStats?.medium}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Priority Active</p>
                  <p className="text-2xl font-bold text-blue-600">{priorityStats?.low}</p>
                </div>
                <Ticket className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e?.target?.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e?.target?.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setLocationFilter({ region: 'all', province: 'all', district: 'all', facility: 'all' });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {/* Location Filter */}
            <LocationFilter
              pngRegions={pngRegions}
              locationFilter={locationFilter}
              setLocationFilter={setLocationFilter}
            />
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fault
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets?.map((ticket) => (
                    <tr
                      key={ticket?.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Ticket className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-blue-600">{ticket?.referenceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{ticket?.facility}</div>
                            <div className="text-gray-500">
                              {pngRegions?.[ticket?.region]?.provinces?.[ticket?.province]?.name || ticket?.province}, {ticket?.district}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{ticket?.equipment}</div>
                          <div className="text-gray-500">{ticket?.equipmentId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {ticket?.faultDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket?.priority)}`}>
                          {ticket?.priority?.charAt(0)?.toUpperCase() + ticket?.priority?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(ticket?.status)} mr-2`}></span>
                          <span className="text-sm text-gray-900">
                            {ticket?.status?.split('_')?.map(word => word?.charAt(0)?.toUpperCase() + word?.slice(1))?.join(' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {ticket?.assignedTo ? (
                            <>
                              <Users className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{ticket?.assignedTo}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 italic">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {new Date(ticket.createdAt)?.toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTickets?.length === 0 && (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No tickets found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or create a new ticket</p>
              </div>
            )}
          </div>

          {/* Results count */}
          {filteredTickets?.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {filteredTickets?.length} of {tickets?.length} tickets
            </div>
          )}
        </div>
      </div>
      {/* Modals */}
      {isCreateModalOpen && (
        <TicketCreationModal
          pngRegions={pngRegions}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTicket}
          isOnline={isOnline}
        />
      )}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          pngRegions={pngRegions}
          onClose={() => setSelectedTicket(null)}
          onUpdate={(updatedTicket) => {
            const updatedTickets = tickets?.map(t => t?.id === updatedTicket?.id ? updatedTicket : t);
            setTickets(updatedTickets);
            localStorage.setItem('ccets_tickets', JSON.stringify(updatedTickets));
            setSelectedTicket(null);
          }}
          isOnline={isOnline}
        />
      )}
    </>
  );
};

export default CCETSTicketManagement;