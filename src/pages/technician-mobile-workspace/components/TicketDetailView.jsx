import React from 'react';
import Icon from '../../../components/AppIcon';

const TicketDetailView = ({ ticket }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Icon name="FileText" size={18} className="text-primary" />
        Ticket Details
      </h3>

      {/* Equipment Information */}
      <div className="bg-muted/30 p-3 rounded-lg">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Equipment from IGA System</h4>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-muted-foreground">Equipment Name</span>
            <p className="text-sm font-medium text-foreground">{ticket?.equipment}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-muted-foreground">Equipment ID</span>
              <p className="text-sm font-medium text-foreground">VR-450-2024-0123</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Last Service</span>
              <p className="text-sm font-medium text-foreground">2024-11-20</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fault Description */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Fault Description</h4>
        <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">
          {ticket?.faultDescription}
        </p>
      </div>

      {/* Resolution Workflow Steps */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Resolution Steps</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="Check" size={14} className="text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">Verify equipment power supply</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">Check temperature sensor calibration</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-muted-foreground">3</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Inspect door seals and gaskets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      {ticket?.photos && ticket?.photos?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Attached Photos</h4>
          <div className="grid grid-cols-3 gap-2">
            {ticket?.photos?.map((photo, index) => (
              <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img 
                  src={photo?.url} 
                  alt={photo?.description || `Equipment photo ${index + 1}`}
                  className="w-full h-full object-cover" 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailView;