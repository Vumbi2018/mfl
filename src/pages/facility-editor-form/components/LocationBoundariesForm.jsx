import React, { useState, useRef, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { MapContainer, TileLayer, FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw'; // Explicit import to ensure L.Draw is attached

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationBoundariesForm = ({ formData, onChange, locationData = [], readOnly }) => {
  // Extract all provinces
  const provinces = locationData.flatMap(item => {
    if (item.provinces) {
      return item.provinces.map(province => ({ value: province.id, label: province.name }));
    } else if (item.districts || item.province_id) { // It's already a province
      return { value: item.id, label: item.name };
    }
    return [];
  });

  const selectedProvinceId = formData?.province_id;
  let districts = [];
  if (selectedProvinceId) {
    for (const item of locationData) {
      if (item.provinces) {
        const province = item.provinces.find(p => p.id == selectedProvinceId);
        if (province) {
          districts = province.districts?.map(district => ({ value: district.id, label: district.name })) || [];
          break;
        }
      } else if ((item.districts || item.province_id) && item.id == selectedProvinceId) {
        districts = item.districts?.map(district => ({ value: district.id, label: district.name })) || [];
        break;
      }
    }
  }

  // --- Map & Polygon Logic ---
  const mapRef = useRef(null);
  const [polygonArea, setPolygonArea] = useState(0);

  // Default center: Tenant aware (Zambia vs PNG)
  const tenantCode = (localStorage.getItem('tenant_code') || 'zambia').toLowerCase();
  const isZambia = tenantCode === 'zambia';
  const defaultCenter = isZambia ? [-13.1339, 27.8493] : [-6.31499, 143.95555];

  const mapCenter = (formData?.latitude && formData?.longitude)
    ? [formData.latitude, formData.longitude]
    : defaultCenter;


  // Sync map center if formData changes (e.g. from coordinates input)
  useEffect(() => {
    if (mapRef.current && formData?.latitude && formData?.longitude) {
      mapRef.current.setView([formData.latitude, formData.longitude], 15);
    }
  }, [formData?.latitude, formData?.longitude]);


  const onCreated = (e) => {
    const layer = e.layer;
    if (e.layerType === 'polygon') {
      const latlngs = layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
      onChange('boundary_polygon', latlngs); // Save to formData

      // Calculate Area (Approximation)
      // L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) if available
      // Or simple estimat
      const area = L.GeometryUtil?.geodesicArea
        ? L.GeometryUtil.geodesicArea(layer.getLatLngs()[0])
        : 0; // fallback if utils missing
      setPolygonArea(Math.round(area));
    }
  };

  const onEdited = (e) => {
    // Handle edits if needed
    // e.layers.eachLayer(layer => ...)
  };

  const onDeleted = (e) => {
    onChange('boundary_polygon', null);
    setPolygonArea(0);
  };

  // --- External Actions ---
  const handleVerifyAddress = () => {
    const query = [
      formData.street_address,
      districts.find(d => d.value == formData.district_id)?.label,
      provinces.find(p => p.value == formData.province_id)?.label,
      formData.country || (isZambia ? 'Zambia' : 'Papua New Guinea')
    ].filter(Boolean).join(', ');


    if (query) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    } else {
      alert('Please fill in address details first.');
    }
  };

  const handleViewSatellite = () => {
    const lat = formData.latitude;
    const lng = formData.longitude;
    if (lat && lng) {
      // Open Google Maps Satellite View
      window.open(`https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=18&basemap=satellite`, '_blank');
    } else {
      alert('Please provide Latitude and Longitude first.');
    }
  };


  return (
    <div className="space-y-6">
      {/* Address Fields */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Province"
          options={provinces}
          value={formData?.province_id ? Number(formData.province_id) : ''}
          onChange={(value) => onChange('province_id', value)}
          required
          disabled={readOnly}
        />
        <Select
          label="District"
          options={districts}
          value={formData?.district_id ? Number(formData.district_id) : ''}
          onChange={(value) => onChange('district_id', value)}
          required
          disabled={readOnly}
        />
      </div>
      <Input
        label="Street Address"
        type="text"
        placeholder="Enter street address"
        value={formData?.street_address || ''}
        onChange={(e) => onChange('street_address', e?.target?.value)}
        required
        disabled={readOnly}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Postal Code"
          type="text"
          placeholder="Enter postal code"
          value={formData?.postal_code || ''}
          onChange={(e) => onChange('postal_code', e?.target?.value)}
          disabled={readOnly}
        />
        <Input
          label="Country"
          type="text"
          value={formData?.country || 'Papua New Guinea'}
          disabled
        />
      </div>

      {/* GPS Section */}
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="MapPin" size={16} />
          GPS Coordinates
        </h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="Latitude"
            type="text"
            placeholder="0.000000"
            value={formData?.latitude ?? ''}
            onChange={(e) => onChange('latitude', e?.target?.value)}
            required
            disabled={readOnly}
          />
          <Input
            label="Longitude"
            type="text"
            placeholder="0.000000"
            value={formData?.longitude ?? ''}
            onChange={(e) => onChange('longitude', e?.target?.value)}
            required
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Elevation (meters)"
            type="number"
            placeholder="0"
            value={formData?.elevation ?? ''}
            onChange={(e) => onChange('elevation', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Accuracy (meters)"
            type="number"
            placeholder="0"
            value={formData?.accuracy ?? ''}
            disabled
          />
        </div>
      </div>

      {/* NEW: Interactive Boundary Map */}
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Icon name="Pentagon" size={16} />
            Facility Boundaries
          </h4>
          <span className="text-xs text-muted-foreground">Use the toolbar to draw</span>
        </div>

        <div className="bg-background rounded-md h-64 border border-border overflow-hidden relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {/* Satellite Toggle could go here but standard OSM is fine for drawing boundaries mostly, 
                     though satellite is better for facilities. Let's stick to OSM for consistency or 
                     maybe finding satellite tiles is better? 
                     Let's stick to OSM to match the other map for now.
                 */}
            <FeatureGroup>
              {!readOnly ? (
                  <EditControl
                    position='topright'
                    onCreated={onCreated}
                    onEdited={onEdited}
                    onDeleted={onDeleted}
                    draw={{
                      rectangle: false,
                      circle: false,
                      circlemarker: false,
                      marker: false,
                      polyline: false,
                      polygon: {
                        allowIntersection: true,
                        showArea: false, // Fix: Disabled to prevent 'type is not defined' error
                        shapeOptions: {
                          color: '#10b981'
                        }
                      },
                    }}
                  />
              ) : null}
              {/* Render existing polygon if present */}
              {formData?.boundary_polygon && (
                <Polygon positions={formData.boundary_polygon} pathOptions={{ color: '#10b981' }} />
              )}
            </FeatureGroup>
          </MapContainer>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="Info" size={12} className="" />
          <span>Polygon area: {polygonArea ? `${polygonArea.toLocaleString()} sq meters` : 'Not defined'}</span>
        </div>
      </div>

      {/* Functional Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          iconName="Navigation"
          iconPosition="left"
          onClick={handleVerifyAddress}
        >
          Verify Address
        </Button>
        <Button
          variant="outline"
          iconName="Satellite"
          iconPosition="left"
          onClick={handleViewSatellite}
        >
          View Satellite
        </Button>
      </div>
    </div>
  );
};

export default LocationBoundariesForm;