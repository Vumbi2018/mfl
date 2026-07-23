import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RouteOptimization = ({ tickets, selectedTicket, onTicketSelect }) => {
  const [optimizationMode, setOptimizationMode] = useState('distance'); // 'distance' or 'priority'

  const sortedTickets = [...tickets]?.sort((a, b) => {
    if (optimizationMode === 'distance') {
      return parseFloat(a?.distance) - parseFloat(b?.distance);
    } else {
      const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityOrder?.[a?.priority] - priorityOrder?.[b?.priority];
    }
  });

  const totalDistance = tickets?.reduce((sum, t) => sum + parseFloat(t?.distance), 0)?.toFixed(1);
  const totalTime = tickets?.reduce((sum, t) => sum + parseInt(t?.estimatedTime), 0);

  return (
    <div className="space-y-4">
      {/* Map View Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Route Optimization</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={optimizationMode === 'distance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOptimizationMode('distance')}
            >
              Distance
            </Button>
            <Button
              variant={optimizationMode === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOptimizationMode('priority')}
            >
              Priority
            </Button>
          </div>
        </div>

        {/* Trip Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/10 p-3 rounded-lg text-center">
            <Icon name="MapPin" size={16} className="text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Stops</p>
            <p className="text-lg font-bold text-primary">{tickets?.length}</p>
          </div>
          <div className="bg-warning/10 p-3 rounded-lg text-center">
            <Icon name="Navigation" size={16} className="text-warning mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-lg font-bold text-warning">{totalDistance} km</p>
          </div>
          <div className="bg-success/10 p-3 rounded-lg text-center">
            <Icon name="Clock" size={16} className="text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Est. Time</p>
            <p className="text-lg font-bold text-success">{Math.round(totalTime / 60)}h {totalTime % 60}m</p>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-muted/30 rounded-lg border border-border aspect-video flex items-center justify-center relative overflow-hidden">
        <div className="text-center">
          <Icon name="Map" size={48} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Route Map</p>
          <p className="text-xs text-muted-foreground">GPS-enabled navigation</p>
        </div>

        {/* Mock Route Pins */}
        {sortedTickets?.map((ticket, index) => (
          <div
            key={ticket?.id}
            className="absolute cursor-pointer"
            style={{
              left: `${20 + (index * 25)}%`,
              top: `${30 + (index * 15)}%`
            }}
            onClick={() => onTicketSelect?.(ticket)}
          >
            <div className="relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white ${
                selectedTicket?.id === ticket?.id ? 'bg-primary scale-110' : 'bg-error'
              }`}>
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optimized Route List */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Optimized Route</h4>
          <p className="text-xs text-muted-foreground">
            Sorted by {optimizationMode === 'distance' ? 'nearest first' : 'priority level'}
          </p>
        </div>
        <div className="divide-y divide-border">
          {sortedTickets?.map((ticket, index) => (
            <div
              key={ticket?.id}
              onClick={() => onTicketSelect?.(ticket)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedTicket?.id === ticket?.id ? 'bg-primary/10' : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">{ticket?.facility}</p>
                  <p className="text-xs text-muted-foreground mb-2">{ticket?.equipment}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon name="Navigation" size={12} />
                      {ticket?.distance}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon name="Clock" size={12} />
                      {ticket?.estimatedTime}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      ticket?.priority === 'High' ? 'bg-error/10 text-error' :
                      ticket?.priority === 'Medium' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {ticket?.priority}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  iconName="Navigation"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${ticket?.location?.lat},${ticket?.location?.lng}`, '_blank');
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteOptimization;