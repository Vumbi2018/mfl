import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TicketDetailModal = ({ isOpen, onClose, ticket, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');

  // Mock history data
  const historyEvents = [
    { id: 1, timestamp: '2025-12-14 10:30', user: 'System', action: 'Ticket Created', details: 'Ticket automatically created from facility report' },
    { id: 2, timestamp: '2025-12-14 10:35', user: 'Sarah Manager', action: 'Priority Updated', details: 'Changed from Medium to High due to vaccine stock' },
    { id: 3, timestamp: '2025-12-14 10:40', user: 'Sarah Manager', action: 'Status Changed', details: 'Changed from New to Assigned' }
  ];

  const getPriorityColorClass = (priority) => {
    switch(priority) {
      case 'High': return 'bg-error/10 text-error border-error/20';
      case 'Medium': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColorClass = (status) => {
    switch(status) {
      case 'New': return 'bg-primary/10 text-primary';
      case 'Assigned': return 'bg-info/10 text-info';
      case 'In Progress': return 'bg-warning/10 text-warning';
      case 'Resolved': return 'bg-success/10 text-success';
      case 'Escalated': return 'bg-error/10 text-error';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Ticket" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground font-mono">{ticket?.referenceNumber}</h2>
              <p className="text-sm text-muted-foreground">{ticket?.facility}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 px-6 border-b border-border">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            History & Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'equipment' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Equipment Metadata
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Status
                  </label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(ticket?.status)}`}>
                    {ticket?.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Priority
                  </label>
                  <span className={`inline-flex px-3 py-1 rounded-lg border text-sm font-medium ${getPriorityColorClass(ticket?.priority)}`}>
                    {ticket?.priority}
                  </span>
                </div>
              </div>

              {/* Location Details */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Icon name="MapPin" size={16} className="text-primary" />
                  Location Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Region</span>
                    <p className="text-sm text-foreground">{ticket?.region}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Province</span>
                    <p className="text-sm text-foreground">{ticket?.province}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">District</span>
                    <p className="text-sm text-foreground">{ticket?.district}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Facility</span>
                    <p className="text-sm text-foreground">{ticket?.facility}</p>
                  </div>
                </div>
              </div>

              {/* Equipment Details */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Equipment
                </label>
                <p className="text-sm text-foreground">{ticket?.equipment}</p>
                <p className="text-xs text-muted-foreground mt-1">Type: {ticket?.equipmentType}</p>
              </div>

              {/* Fault Description */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Fault Description
                </label>
                <p className="text-sm text-foreground">{ticket?.faultDescription}</p>
              </div>

              {/* SLA Information */}
              <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Icon name="Clock" size={20} className="text-warning mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-warning mb-1">SLA Timer</h4>
                    <p className="text-2xl font-bold text-warning">{ticket?.slaTimer}</p>
                    <p className="text-xs text-warning/80 mt-1">Time remaining until SLA breach</p>
                  </div>
                </div>
              </div>

              {/* Assigned Technician */}
              {ticket?.assignedTechnician && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Assigned Technician
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon name="User" size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{ticket?.assignedTechnician}</p>
                      <p className="text-xs text-muted-foreground">Field Technician</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Complete Audit Trail</h3>
              <div className="space-y-3">
                {historyEvents?.map(event => (
                  <div key={event?.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="History" size={16} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">{event?.action}</p>
                        <span className="text-xs text-muted-foreground">{event?.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{event?.details}</p>
                      <p className="text-xs text-muted-foreground">By: {event?.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Equipment Information from IGA System</h3>
              <div className="bg-info/10 border border-info/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={16} className="text-info mt-0.5" />
                  <div>
                    <p className="text-sm text-info mb-2">Equipment data synchronized from IGA System</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-info/80">Equipment ID</span>
                        <p className="text-sm font-medium text-info">VR-450-2024-0123</p>
                      </div>
                      <div>
                        <span className="text-xs text-info/80">Installation Date</span>
                        <p className="text-sm font-medium text-info">2024-03-15</p>
                      </div>
                      <div>
                        <span className="text-xs text-info/80">Last Maintenance</span>
                        <p className="text-sm font-medium text-info">2024-11-20</p>
                      </div>
                      <div>
                        <span className="text-xs text-info/80">Warranty Status</span>
                        <p className="text-sm font-medium text-info">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="outline"
            iconName="Edit"
            iconPosition="left"
            onClick={() => console.log('Edit ticket')}
          >
            Edit Ticket
          </Button>
          <Button
            variant="default"
            iconName="Check"
            iconPosition="left"
            onClick={() => {
              onStatusUpdate?.(ticket?.id, 'Resolved');
              onClose();
            }}
          >
            Mark Resolved
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;