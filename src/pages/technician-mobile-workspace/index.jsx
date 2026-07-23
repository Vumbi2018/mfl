import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MyAssignedTickets from './components/MyAssignedTickets';
import TicketDetailView from './components/TicketDetailView';
import StatusUpdatePanel from './components/StatusUpdatePanel';
import PartsRequestForm from './components/PartsRequestForm';
import PhotoDocumentation from './components/PhotoDocumentation';
import GPSLocationVerification from './components/GPSLocationVerification';
import OfflineSyncIndicator from './components/OfflineSyncIndicator';
import VoiceInputRecorder from './components/VoiceInputRecorder';
import EmergencyEscalation from './components/EmergencyEscalation';
import RouteOptimization from './components/RouteOptimization';

const TechnicianMobileWorkspace = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [isOnline, setIsOnline] = useState(true);
  const [showPartsRequest, setShowPartsRequest] = useState(false);
  const [showPhotoDoc, setShowPhotoDoc] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showEmergencyEscalation, setShowEmergencyEscalation] = useState(false);

  // Mock assigned tickets for technician
  const [assignedTickets, setAssignedTickets] = useState([
    {
      id: 1,
      referenceNumber: 'WHP-HAG-MTH-GEN-20251214-0001',
      facility: 'Mt Hagen General Hospital',
      equipment: 'Vaccine Refrigerator VR-450',
      faultDescription: 'Temperature not maintaining +2°C to +8°C range',
      priority: 'High',
      status: 'Assigned',
      distance: '2.3 km',
      estimatedTime: '15 min',
      location: { lat: -5.856, lng: 144.296 },
      photos: []
    },
    {
      id: 2,
      referenceNumber: 'WHP-HAG-TMB-HC-20251213-0002',
      facility: 'Tambul Health Centre',
      equipment: 'Cold Room CR-2000',
      faultDescription: 'Door seal damaged, cold air leaking',
      priority: 'Medium',
      status: 'In Progress',
      distance: '8.7 km',
      estimatedTime: '35 min',
      location: { lat: -5.923, lng: 144.145 },
      photos: []
    }
  ]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleStatusUpdate = (ticketId, newStatus, notes) => {
    setAssignedTickets(assignedTickets?.map(t =>
      t?.id === ticketId ? { ...t, status: newStatus, progressNotes: notes } : t
    ));
  };

  const handlePartsRequest = (requestData) => {
    console.log('Parts request submitted:', requestData);
    setShowPartsRequest(false);
  };

  const handlePhotoUpload = (photos) => {
    if (selectedTicket) {
      setAssignedTickets(assignedTickets?.map(t =>
        t?.id === selectedTicket?.id ? { ...t, photos: [...(t?.photos || []), ...photos] } : t
      ));
    }
    setShowPhotoDoc(false);
  };

  const handleVoiceNote = (audioData) => {
    console.log('Voice note recorded:', audioData);
    setShowVoiceInput(false);
  };

  const handleEmergencyEscalate = (escalationData) => {
    console.log('Emergency escalation:', escalationData);
    setShowEmergencyEscalation(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Wrench" size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">My Workspace</h1>
                <p className="text-xs text-muted-foreground">Field Technician Portal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              iconName="Menu"
              onClick={() => console.log('Open menu')}
            />
          </div>

          {/* Offline Sync Indicator */}
          <OfflineSyncIndicator isOnline={isOnline} />
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            iconName="List"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            iconName="Map"
            onClick={() => setViewMode('map')}
          >
            Map
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Camera"
            onClick={() => setShowPhotoDoc(true)}
            disabled={!selectedTicket}
          >
            Photo
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Mic"
            onClick={() => setShowVoiceInput(true)}
            disabled={!selectedTicket}
          >
            Voice
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Package"
            onClick={() => setShowPartsRequest(true)}
            disabled={!selectedTicket}
          >
            Parts
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {/* My Assigned Tickets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-foreground">My Assigned Tickets</h2>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {assignedTickets?.length} Active
                </span>
              </div>
              <MyAssignedTickets
                tickets={assignedTickets}
                selectedTicket={selectedTicket}
                onTicketSelect={handleTicketSelect}
              />
            </div>

            {/* Selected Ticket Detail */}
            {selectedTicket && (
              <div className="space-y-4">
                <TicketDetailView ticket={selectedTicket} />
                <StatusUpdatePanel
                  ticket={selectedTicket}
                  onStatusUpdate={handleStatusUpdate}
                />
                <GPSLocationVerification ticket={selectedTicket} />
              </div>
            )}
          </div>
        ) : (
          <RouteOptimization
            tickets={assignedTickets}
            selectedTicket={selectedTicket}
            onTicketSelect={handleTicketSelect}
          />
        )}
      </div>

      {/* Emergency FAB */}
      <button
        onClick={() => setShowEmergencyEscalation(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-error text-white shadow-lg flex items-center justify-center hover:bg-error/90 transition-colors z-50"
      >
        <Icon name="AlertTriangle" size={24} />
      </button>

      {/* Modals */}
      {showPartsRequest && (
        <PartsRequestForm
          isOpen={showPartsRequest}
          onClose={() => setShowPartsRequest(false)}
          ticket={selectedTicket}
          onSubmit={handlePartsRequest}
        />
      )}

      {showPhotoDoc && (
        <PhotoDocumentation
          isOpen={showPhotoDoc}
          onClose={() => setShowPhotoDoc(false)}
          ticket={selectedTicket}
          onUpload={handlePhotoUpload}
        />
      )}

      {showVoiceInput && (
        <VoiceInputRecorder
          isOpen={showVoiceInput}
          onClose={() => setShowVoiceInput(false)}
          onSave={handleVoiceNote}
        />
      )}

      {showEmergencyEscalation && (
        <EmergencyEscalation
          isOpen={showEmergencyEscalation}
          onClose={() => setShowEmergencyEscalation(false)}
          ticket={selectedTicket}
          onEscalate={handleEmergencyEscalate}
        />
      )}
    </div>
  );
};

export default TechnicianMobileWorkspace;