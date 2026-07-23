import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const GPSCoordinatesWidget = ({ coordinates, onCoordinatesChange }) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureGPS = () => {
    setIsCapturing(true);
    if (navigator.geolocation) {
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          const newCoordinates = {
            latitude: position?.coords?.latitude?.toFixed(6),
            longitude: position?.coords?.longitude?.toFixed(6),
            accuracy: position?.coords?.accuracy?.toFixed(2)
          };
          onCoordinatesChange(newCoordinates);
          setIsCapturing(false);
        },
        (error) => {
          console.error('GPS Error:', error);
          setIsCapturing(false);
        }
      );
    }
  };

  const currentCoords = coordinates || {
    latitude: '6.927079',
    longitude: '79.861244',
    accuracy: '15.00'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="MapPin" size={16} />
        GPS Coordinates
      </h3>
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Latitude</label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <Icon name="Navigation" size={14} className="text-muted-foreground" />
              <span className="text-sm font-mono text-foreground">{currentCoords?.latitude}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Longitude</label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <Icon name="Navigation" size={14} className="text-muted-foreground" />
              <span className="text-sm font-mono text-foreground">{currentCoords?.longitude}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Accuracy</label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <Icon name="Target" size={14} className="text-muted-foreground" />
              <span className="text-sm font-mono text-foreground">{currentCoords?.accuracy}m</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          iconName="Crosshair"
          iconPosition="left"
          loading={isCapturing}
          onClick={handleCaptureGPS}
        >
          {isCapturing ? 'Capturing...' : 'Capture Current Location'}
        </Button>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon name="Info" size={12} />
            <span>Last updated: 2025-12-13 16:45</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSCoordinatesWidget;