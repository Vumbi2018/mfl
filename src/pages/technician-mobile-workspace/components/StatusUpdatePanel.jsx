import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StatusUpdatePanel = ({ ticket, onStatusUpdate }) => {
  const [progressNotes, setProgressNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(ticket?.status);

  const statusOptions = [
    { id: 'assigned', label: 'Assigned', icon: 'Inbox', color: 'primary' },
    { id: 'inprogress', label: 'In Progress', icon: 'Play', color: 'warning' },
    { id: 'resolved', label: 'Resolved', icon: 'Check', color: 'success' },
    { id: 'escalated', label: 'Escalate', icon: 'ArrowUp', color: 'error' }
  ];

  const handleUpdateStatus = () => {
    if (!progressNotes?.trim()) {
      alert('Please add progress notes before updating status');
      return;
    }
    onStatusUpdate?.(ticket?.id, selectedStatus, progressNotes);
    setProgressNotes('');
  };

  const getStatusColorClass = (color) => {
    switch(color) {
      case 'primary': return 'bg-primary/10 text-primary border-primary/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'success': return 'bg-success/10 text-success border-success/20';
      case 'error': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Icon name="Activity" size={18} className="text-primary" />
        Update Status
      </h3>

      {/* Status Selection */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          Select New Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions?.map(status => (
            <button
              key={status?.id}
              onClick={() => setSelectedStatus(status?.label)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedStatus === status?.label
                  ? getStatusColorClass(status?.color)
                  : 'bg-muted/30 border-border text-muted-foreground'
              }`}
            >
              <Icon name={status?.icon} size={20} className="mx-auto mb-1" />
              <p className="text-xs font-medium">{status?.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Notes */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          Progress Notes *
        </label>
        <textarea
          value={progressNotes}
          onChange={(e) => setProgressNotes(e.target.value)}
          placeholder="Describe the work performed, issues found, or next steps..."
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Required for status updates
        </p>
      </div>

      {/* Update Button */}
      <Button
        variant="default"
        fullWidth
        iconName="Save"
        iconPosition="left"
        onClick={handleUpdateStatus}
        disabled={!progressNotes?.trim() || selectedStatus === ticket?.status}
      >
        Update Ticket Status
      </Button>
    </div>
  );
};

export default StatusUpdatePanel;