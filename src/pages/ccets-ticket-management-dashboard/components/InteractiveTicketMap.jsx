import React from 'react';
import Icon from '../../../components/AppIcon';

const InteractiveTicketMap = ({ tickets, selectedTicket, onTicketSelect, selectedLocation }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return '#3b82f6'; // blue
      case 'Assigned': return '#8b5cf6'; // purple
      case 'In Progress': return '#f59e0b'; // amber
      case 'Resolved': return '#10b981'; // green
      case 'Escalated': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Map Container */}
      <div className="flex-1 bg-muted/30 rounded-lg border border-border relative overflow-hidden">
        {/* PNG Map Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Icon name="Map" size={48} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Interactive Map</p>
            <p className="text-xs text-muted-foreground">Papua New Guinea</p>
          </div>
        </div>

        {/* Mock Ticket Pins */}
        {tickets?.map((ticket, index) => (
          <div
            key={ticket?.id}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${30 + (index * 20)}%`,
              top: `${40 + (index * 15)}%`,
              zIndex: selectedTicket?.id === ticket?.id ? 10 : 5
            }}
            onClick={() => onTicketSelect?.(ticket)}
          >
            <div className="relative group">
              {/* Pin */}
              <div 
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform ${
                  selectedTicket?.id === ticket?.id ? 'scale-125' : 'hover:scale-110'
                }`}
                style={{ 
                  backgroundColor: getStatusColor(ticket?.status),
                  borderColor: 'white'
                }}
              >
                <Icon name="MapPin" size={16} className="text-white" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-card border border-border rounded-lg shadow-lg p-3 whitespace-nowrap">
                  <p className="text-xs font-semibold text-foreground">{ticket?.facility}</p>
                  <p className="text-xs text-muted-foreground">{ticket?.equipment}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span className="text-xs font-medium" style={{ color: getStatusColor(ticket?.status) }}>
                      {ticket?.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-card border border-border rounded-lg">
        <h4 className="text-xs font-semibold text-foreground mb-2">Status Legend</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('New') }} />
            <span className="text-xs text-muted-foreground">New</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('Assigned') }} />
            <span className="text-xs text-muted-foreground">Assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('In Progress') }} />
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('Resolved') }} />
            <span className="text-xs text-muted-foreground">Resolved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('Escalated') }} />
            <span className="text-xs text-muted-foreground">Escalated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTicketMap;