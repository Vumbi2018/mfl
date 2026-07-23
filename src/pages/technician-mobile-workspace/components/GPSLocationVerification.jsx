import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const GPSLocationVerification = ({ ticket }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [distanceToFacility, setDistanceToFacility] = useState(null);
  const [travelTime, setTravelTime] = useState(null);

  const handleVerifyLocation = () => {
    setIsVerifying(true);
    
    // Get current GPS location
    if (navigator?.geolocation) {
      navigator?.geolocation?.getCurrentPosition(
        (position) => {
          const location = {
            lat: position?.coords?.latitude,
            lng: position?.coords?.longitude,
            accuracy: position?.coords?.accuracy
          };
          setCurrentLocation(location);
          
          // Calculate distance (mock calculation)
          const distance = calculateDistance(
            location?.lat,
            location?.lng,
            ticket?.location?.lat,
            ticket?.location?.lng
          );
          setDistanceToFacility(distance);
          setTravelTime(Math.round((distance / 40) * 60)); // Assuming 40 km/h average speed
          setIsVerifying(false);
        },
        (error) => {
          console.error('GPS error:', error);
          alert('Unable to get GPS location. Please enable location services.');
          setIsVerifying(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('GPS not supported on this device');
      setIsVerifying(false);
    }
  };

  // Haversine formula for distance calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Icon name="MapPin" size={18} className="text-primary" />
        GPS Location Verification
      </h3>

      {/* Facility Location */}
      <div className="bg-muted/30 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">Facility Location</p>
        <div className="flex items-center gap-2">
          <Icon name="Building" size={16} className="text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{ticket?.facility}</p>
            <p className="text-xs text-muted-foreground">
              {ticket?.location?.lat?.toFixed(4)}, {ticket?.location?.lng?.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Current Location */}
      {currentLocation && (
        <div className="bg-success/10 border border-success/20 p-3 rounded-lg">
          <p className="text-xs text-success mb-2">Your Current Location</p>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Navigation" size={16} className="text-success" />
            <div>
              <p className="text-sm font-medium text-success">
                {currentLocation?.lat?.toFixed(4)}, {currentLocation?.lng?.toFixed(4)}
              </p>
              <p className="text-xs text-success/80">
                Accuracy: ±{currentLocation?.accuracy?.toFixed(0)}m
              </p>
            </div>
          </div>
          
          {/* Distance and Travel Time */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-success/20 p-2 rounded">
              <p className="text-xs text-success/80">Distance</p>
              <p className="text-sm font-bold text-success">{distanceToFacility} km</p>
            </div>
            <div className="bg-success/20 p-2 rounded">
              <p className="text-xs text-success/80">Est. Time</p>
              <p className="text-sm font-bold text-success">{travelTime} min</p>
            </div>
          </div>
        </div>
      )}

      {/* Verify Button */}
      <Button
        variant="default"
        fullWidth
        iconName="MapPin"
        iconPosition="left"
        onClick={handleVerifyLocation}
        loading={isVerifying}
        disabled={isVerifying}
      >
        {isVerifying ? 'Verifying Location...' : 'Verify My Location'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Location data used for SLA tracking and route optimization
      </p>
    </div>
  );
};

export default GPSLocationVerification;