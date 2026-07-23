import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, LayersControl, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

// Fix Leaflet default icon issue
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Unified marker and map controller
const LocationMarker = ({ position, onLocationSelect }) => {
  const map = useMap();

  // Fix map rendering in modal
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <Marker position={position}>
      <Popup>
        Selected Location<br />
        {position[0].toFixed(5)}, {position[1].toFixed(5)}
      </Popup>
    </Marker>
  ) : null;
};

const GPSCaptureCard = ({ onCapture, initialCoordinates }) => {
  const [coordinates, setCoordinates] = useState(initialCoordinates || null);
  const [accuracy, setAccuracy] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (initialCoordinates) {
      setCoordinates(initialCoordinates);
    }
  }, [initialCoordinates]);

  const captureLocation = () => {
    setIsCapturing(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your device');
      setIsCapturing(false);
      return;
    }

    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position?.coords?.latitude,
          longitude: position?.coords?.longitude,
          altitude: position?.coords?.altitude,
          timestamp: new Date()?.toISOString()
        };
        setCoordinates(coords);
        setAccuracy(position?.coords?.accuracy);
        setIsCapturing(false);
        onCapture(coords);
      },
      (err) => {
        setError(`Unable to retrieve location: ${err?.message}`);
        setIsCapturing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const getAccuracyStatus = () => {
    if (!accuracy) return { text: 'Unknown', color: 'text-muted-foreground', icon: 'HelpCircle' };
    if (accuracy <= 10) return { text: 'Excellent', color: 'text-success', icon: 'CheckCircle' };
    if (accuracy <= 30) return { text: 'Good', color: 'text-success', icon: 'CheckCircle' };
    if (accuracy <= 50) return { text: 'Fair', color: 'text-warning', icon: 'AlertCircle' };
    return { text: 'Poor', color: 'text-error', icon: 'XCircle' };
  };

  const accuracyStatus = getAccuracyStatus();

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="MapPin" size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">GPS Coordinates</h2>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-md">
            <Icon name="AlertTriangle" size={16} className="text-error mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {coordinates ? (
          <div className="space-y-3">
            {/* Map Preview Modal */}
            {showMap && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <div className="bg-card w-full max-w-5xl h-[85vh] rounded-lg shadow-xl border border-border overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-border flex justify-between items-center shrink-0">
                    <h3 className="font-semibold">Location Preview</h3>
                    <button onClick={() => setShowMap(false)} className="text-muted-foreground hover:text-foreground">
                      <Icon name="X" size={20} />
                    </button>
                  </div>
                  <div className="flex-1 w-full relative bg-muted shrink-0 z-0 min-h-0">
                    <MapContainer
                      center={coordinates ? [coordinates.latitude, coordinates.longitude] : ((localStorage.getItem('tenant_code') || 'zambia').toLowerCase() === 'zambia' ? [-13.1339, 27.8493] : [-6.314993, 143.95555])}
                      zoom={coordinates ? 15 : 6}
                      style={{ height: '100%', width: '100%' }}
                    >

                      <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="Street Map">
                          <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxNativeZoom={19}
                            maxZoom={22}
                          />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellite">
                          <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            maxNativeZoom={17}
                            maxZoom={22}
                          />
                        </LayersControl.BaseLayer>
                      </LayersControl>
                      <ScaleControl position="bottomleft" />

                      <LocationMarker
                        position={coordinates ? [coordinates.latitude, coordinates.longitude] : null}
                        onLocationSelect={(latlng) => {
                          const newCoords = {
                            ...coordinates,
                            latitude: latlng.lat,
                            longitude: latlng.lng,
                            accuracy: 0,
                            timestamp: new Date().toISOString()
                          };
                          setCoordinates(newCoords);
                          onCapture(newCoords);
                        }}
                      />
                    </MapContainer>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full shadow-md text-xs font-medium z-[1000] pointer-events-none">
                      Tap map to set location
                    </div>
                  </div>
                  <div className="p-3 text-xs text-center text-muted-foreground bg-card shrink-0">
                    {coordinates
                      ? `Coordinates: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
                      : "Tap on the map to select a location"
                    }
                  </div>
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latitude</span>
                <span className="text-sm font-medium text-foreground">{coordinates?.latitude?.toFixed(6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Longitude</span>
                <span className="text-sm font-medium text-foreground">{coordinates?.longitude?.toFixed(6)}</span>
              </div>
              {coordinates?.altitude && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Altitude</span>
                  <span className="text-sm font-medium text-foreground">{coordinates?.altitude?.toFixed(2)} m</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name={accuracyStatus?.icon} size={16} className={accuracyStatus?.color} />
                <span className="text-sm text-muted-foreground">Accuracy</span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${accuracyStatus?.color}`}>{accuracyStatus?.text}</span>
                {accuracy && <span className="text-xs text-muted-foreground ml-2">±{accuracy?.toFixed(1)}m</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="Clock" size={12} />
              <span>Captured: {new Date(coordinates.timestamp)?.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="Navigation" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No GPS coordinates captured yet</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="default"
            iconName="Navigation"
            iconPosition="left"
            onClick={captureLocation}
            loading={isCapturing}
            fullWidth
          >
            {isCapturing ? 'Capturing Location...' : 'Capture Current Location'}
          </Button>

          <Button
            variant="outline"
            iconName="Map"
            iconPosition="left"
            onClick={() => setShowMap(true)}
            fullWidth
          >
            {coordinates ? 'View/Adjust on Map' : 'Set Location Manually'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GPSCaptureCard;