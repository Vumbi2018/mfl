import React from 'react';
import Icon from '../../../components/AppIcon';

const MyAssignedTickets = ({ tickets, selectedTicket, onTicketSelect }) => {
  const getPriorityColorClass = (priority) => {
    switch(priority) {
      case 'High': return 'bg-error/10 text-error border-l-error';
      case 'Medium': return 'bg-warning/10 text-warning border-l-warning';
      default: return 'bg-muted text-muted-foreground border-l-muted';
    }
  };

  const getStatusColorClass = (status) => {
    switch(status) {
      case 'Assigned': return 'bg-primary/10 text-primary';
      case 'In Progress': return 'bg-warning/10 text-warning';
      case 'Resolved': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      {tickets?.map(ticket => (
        <div
          key={ticket?.id}
          onClick={() => onTicketSelect?.(ticket)}
          className={`bg-card border-l-4 rounded-lg p-4 cursor-pointer transition-all ${
            selectedTicket?.id === ticket?.id 
              ? 'border-l-primary shadow-lg' 
              : getPriorityColorClass(ticket?.priority)
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {ticket?.facility}
              </h3>
              <p className="text-xs font-mono text-muted-foreground">
                {ticket?.referenceNumber}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(ticket?.status)}`}>
              {ticket?.status}
            </span>
          </div>

          {/* Equipment */}
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Package" size={14} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{ticket?.equipment}</span>
          </div>

          {/* Fault */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {ticket?.faultDescription}
          </p>

          {/* Priority and Distance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColorClass(ticket?.priority)}`}>
                {ticket?.priority}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Icon name="Navigation" size={14} />
                <span className="text-xs">{ticket?.distance}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Icon name="Clock" size={14} />
                <span className="text-xs">{ticket?.estimatedTime}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyAssignedTickets;