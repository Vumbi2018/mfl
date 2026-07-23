import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkCollectionCard = ({ onBulkSubmit }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [collectedData, setCollectedData] = useState([]);

  const templates = [
    { value: 'basic_survey', label: 'Basic Facility Survey' },
    { value: 'equipment_inventory', label: 'Equipment Inventory' },
    { value: 'staff_assessment', label: 'Staff Assessment' },
    { value: 'service_availability', label: 'Service Availability Check' },
    { value: 'infrastructure_audit', label: 'Infrastructure Audit' }
  ];

  const mockCollectedData = [
    {
      id: 1,
      facilityName: "District Health Center",
      template: "Basic Facility Survey",
      completionStatus: 100,
      timestamp: new Date(Date.now() - 3600000)?.toISOString(),
      photosCount: 5,
      gpsTagged: true
    },
    {
      id: 2,
      facilityName: "Community Clinic",
      template: "Basic Facility Survey",
      completionStatus: 75,
      timestamp: new Date(Date.now() - 7200000)?.toISOString(),
      photosCount: 3,
      gpsTagged: true
    },
    {
      id: 3,
      facilityName: "Primary Care Unit",
      template: "Basic Facility Survey",
      completionStatus: 50,
      timestamp: new Date(Date.now() - 10800000)?.toISOString(),
      photosCount: 2,
      gpsTagged: false
    }
  ];

  const handleStartCollection = () => {
    setCollectedData(mockCollectedData);
  };

  const handleSubmitAll = () => {
    onBulkSubmit(collectedData);
  };

  const getCompletionColor = (status) => {
    if (status === 100) return 'text-success bg-success/10';
    if (status >= 75) return 'text-warning bg-warning/10';
    return 'text-error bg-error/10';
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="Layers" size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Bulk Collection</h2>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <Select
          label="Survey Template"
          options={templates}
          value={selectedTemplate}
          onChange={setSelectedTemplate}
          placeholder="Select a template"
          description="Choose a pre-configured survey template for rapid data collection"
        />

        {collectedData?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="ClipboardList" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No bulk collection in progress</p>
            <Button
              variant="default"
              iconName="Play"
              iconPosition="left"
              onClick={handleStartCollection}
              disabled={!selectedTemplate}
            >
              Start Bulk Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Collection Progress</span>
              <span className="text-sm text-muted-foreground">{collectedData?.length} facilities</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {collectedData?.map((item) => (
                <div key={item?.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{item?.facilityName}</h4>
                      <p className="text-xs text-muted-foreground">{item?.template}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${getCompletionColor(item?.completionStatus)}`}>
                      {item?.completionStatus}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Icon name="Camera" size={12} />
                      <span>{item?.photosCount} photos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name={item?.gpsTagged ? 'MapPin' : 'MapPinOff'} size={12} />
                      <span>{item?.gpsTagged ? 'GPS tagged' : 'No GPS'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Clock" size={12} />
                      <span>{new Date(item.timestamp)?.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                iconName="Plus"
                iconPosition="left"
                fullWidth
              >
                Add Facility
              </Button>
              <Button
                variant="default"
                iconName="Upload"
                iconPosition="left"
                onClick={handleSubmitAll}
                fullWidth
              >
                Submit All
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Icon name="Info" size={16} className="text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Complete all required fields before submission. Incomplete surveys will be saved as drafts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkCollectionCard;