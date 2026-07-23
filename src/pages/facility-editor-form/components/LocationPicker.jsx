import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const LocationPicker = ({ latitude, longitude, onLocationChange }) => {
    const [position, setPosition] = useState(null);

    // Determine tenant default center
    const tenantCode = (localStorage.getItem('tenant_code') || 'zambia').toLowerCase();
    const defaultCenter = tenantCode === 'zambia' ? [-13.1339, 27.8493] : [-6.314993, 143.95555];

    useEffect(() => {
        if (latitude && longitude) {
            setPosition({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
        }
    }, [latitude, longitude]);

    const handleSetPosition = (latlng) => {
        setPosition(latlng);
        onLocationChange({ lat: latlng.lat, lng: latlng.lng });
    };

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Facility Location</h3>
            <p className="text-xs text-muted-foreground">Click on the map to set the facility location.</p>
            <div className="h-[300px] w-full rounded-md overflow-hidden border">
                <MapContainer center={position || defaultCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker position={position} setPosition={handleSetPosition} />
                </MapContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-gray-600">Latitude</label>
                    <input
                        type="number"
                        value={position?.lat || ''}
                        readOnly
                        className="w-full mt-1 p-2 bg-gray-50 border rounded text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-600">Longitude</label>
                    <input
                        type="number"
                        value={position?.lng || ''}
                        readOnly
                        className="w-full mt-1 p-2 bg-gray-50 border rounded text-sm"
                    />
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;
