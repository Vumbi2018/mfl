import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmergencyEscalation = ({ isOpen, onClose, ticket, onEscalate }) => {
  const [escalationReason, setEscalationReason] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('high');
  const [selectedContact, setSelectedContact] = useState('provincial');

  const escalationContacts = [
    { 
      id: 'provincial', 
      name: 'Provincial Manager',
      contact: 'Sarah Manager',
      phone: '+675 7234 5678',
      type: 'Provincial',
      icon: 'User'
    },
    { 
      id: 'national', 
      name: 'National Helpdesk',
      contact: '24/7 Support',
      phone: '+675 325 1234',
      type: 'National',
      icon: 'Phone'
    },
    { 
      id: 'emergency', 
      name: 'Emergency Engineer',
      contact: 'Technical Expert',
      phone: '+675 7890 1234',
      type: 'Emergency',
      icon: 'AlertTriangle'
    }
  ];

  const handleEscalate = () => {
    if (!escalationReason?.trim()) {
      alert('Please provide escalation reason');
      return;
    }

    const contact = escalationContacts?.find(c => c?.id === selectedContact);
    onEscalate?.({
      ticketId: ticket?.id,
      reason: escalationReason,
      urgencyLevel,
      escalatedTo: contact,
      timestamp: new Date().toISOString()
    });
  };

  const handleDirectCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone) => {
    const message = `Emergency escalation for ticket ${ticket?.referenceNumber}. Reason: ${escalationReason}`;
    window.open(`https://wa.me/${phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-card border border-border rounded-t-2xl md:rounded-lg shadow-lg w-full md:max-w-lg mx-0 md:mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-error/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error flex items-center justify-center">
              <Icon name="AlertTriangle" size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-error">Emergency Escalation</h2>
              <p className="text-xs text-error/80">Direct communication channel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Ticket Info */}
          {ticket && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Current Ticket</p>
              <p className="text-sm font-mono text-foreground">{ticket?.referenceNumber}</p>
              <p className="text-xs text-muted-foreground mt-1">{ticket?.facility}</p>
            </div>
          )}

          {/* Urgency Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['high', 'critical', 'emergency'].map(level => (
                <button
                  key={level}
                  onClick={() => setUrgencyLevel(level)}
                  className={`p-3 rounded-lg border-2 text-center transition-all capitalize ${
                    urgencyLevel === level
                      ? level === 'emergency' 
                        ? 'bg-error/10 border-error text-error'
                        : level === 'critical'
                        ? 'bg-warning/10 border-warning text-warning'
                        : 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted/30 border-border text-muted-foreground'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Escalation Reason */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Escalation Reason *
            </label>
            <textarea
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Describe why escalation is needed and what assistance is required..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              rows={4}
            />
          </div>

          {/* Escalation Contacts */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Escalate To
            </label>
            <div className="space-y-2">
              {escalationContacts?.map(contact => (
                <div
                  key={contact?.id}
                  onClick={() => setSelectedContact(contact?.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedContact === contact?.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/30 border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={contact?.icon} size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground">{contact?.name}</p>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                          {contact?.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{contact?.contact}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectCall(contact?.phone);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs hover:bg-success/20"
                        >
                          <Icon name="Phone" size={12} />
                          Call
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(contact?.phone);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-info/10 text-info rounded text-xs hover:bg-info/20"
                        >
                          <Icon name="MessageCircle" size={12} />
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-warning mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-warning mb-1">Emergency Protocol</p>
                <p className="text-xs text-warning/80">
                  This will immediately notify the selected contact via phone call, SMS, and WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            fullWidth
            iconName="Send"
            iconPosition="left"
            onClick={handleEscalate}
            disabled={!escalationReason?.trim()}
            className="bg-error hover:bg-error/90"
          >
            Escalate Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyEscalation;