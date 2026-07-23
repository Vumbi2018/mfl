import api from '../../../utils/api';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents, LayersControl, FeatureGroup, GeoJSON, ZoomControl, ScaleControl, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import MeasureControl from './MeasureControl';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useTheme } from '../../../components/ThemeProvider';
import { Layers, Tag, Eye, EyeOff, MapPin, Compass, Maximize2, Minimize2, Settings, ListFilter, CheckSquare, Square } from 'lucide-react';
import { getProvincialHQIcon, getDistrictHQIcon } from '../../../utils/capitalIcons';
import CapitalDistanceCard from './CapitalDistanceCard';
import FacilityDetailPanel from './FacilityDetailPanel';
import { findNearestCapitals } from '../../../utils/distanceCalculator';
import Icon from '../../../components/AppIcon';

// Fix Leaflet default icon issue
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Cluster Icon
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  const size = count >= 50 ? 46 : count >= 10 ? 40 : 34;
  const color = count >= 50 ? '#1d4ed8' : count >= 10 ? '#3b82f6' : '#60a5fa';
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border: 3px solid white; 
        box-shadow: 0 3px 12px rgba(0,0,0,0.2); 
        color: white; 
        font-weight: 800; 
        font-size: ${size / 2.8}px;
        transition: all 0.2s ease;
      ">
        ${count}
      </div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size)
  });
};

// Individual Facility Icon
const getFacilityIcon = (type, status) => {
  const s = (status || '').toLowerCase();
  const isOperational = s.includes('open') || s.includes('active') || s.includes('functional') || s.includes('operational');
  const isClosed = s.includes('closed') || s.includes('inactive') || s.includes('non-functional');
  
  const color = isOperational ? '#10b981' : isClosed ? '#ef4444' : '#f59e0b';
  
  return L.divIcon({
    className: 'custom-facility-icon',
    html: `
      <div style="
        background-color: ${color}; 
        width: 18px; 
        height: 18px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border: 2px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style="width: 12px; height: 12px;">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9]
  });
};

const MapStatsCards = ({ stats, theme, activeProvince, activeDistrict, filteredCount }) => {
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-3 flex flex-col gap-3 z-10 shadow-xl min-w-[280px]">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
        <div className="p-2 bg-primary/10 rounded-xl">
          <img src={theme.logoUrl.startsWith('http') ? theme.logoUrl : (theme.logoUrl.startsWith('/uploads') ? `http://localhost:5002${theme.logoUrl}` : theme.logoUrl)} alt="Emblem" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-extrabold text-slate-800 truncate uppercase tracking-tight">
            {activeDistrict || activeProvince || 'National View'}
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {filteredCount} Total Facilities
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
          <span className="text-[8px] text-emerald-600 font-black uppercase tracking-tighter">Active</span>
          <div className="text-sm font-black text-emerald-700">{stats.operational}</div>
        </div>
        <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
          <span className="text-[8px] text-amber-600 font-black uppercase tracking-tighter">Pending</span>
          <div className="text-sm font-black text-amber-700">{stats.pending}</div>
        </div>
        <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
          <span className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">Closed</span>
          <div className="text-sm font-black text-rose-700">{stats.closed}</div>
        </div>
      </div>
      
      {activeProvince && (
        <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 pt-1 border-t border-slate-50">
          <span className="uppercase">Drill-Down Active</span>
          <i className="fas fa-search-location"></i>
        </div>
      )}
    </div>
  );
};

// Interactive Floating Map Legend & Control Panel
const MapLegend = ({ showLabels, setShowLabels, visibleLayers, setVisibleLayers, showLegend }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!showLegend) return null;

  return (
    <div className="absolute bottom-6 left-14 z-[1000] flex flex-col gap-2">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl p-3 text-xs min-w-[230px] transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-2 mb-2">
          <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" /> Map Legend & Controls
          </span>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 text-xs px-1"
          >
            <i className={`fas fa-${collapsed ? 'chevron-up' : 'chevron-down'}`}></i>
          </button>
        </div>

        {!collapsed && (
          <div className="space-y-3">
            {/* Operational Status */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Operational Status</span>
              <div className="space-y-1.5 text-[11px] font-semibold text-slate-700 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs"></span>
                    <span>Operational / Active</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.facilities_operational} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, facilities_operational: e.target.checked }))}
                    className="accent-emerald-600 rounded cursor-pointer" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs"></span>
                    <span>Pending / Unknown</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.facilities_pending} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, facilities_pending: e.target.checked }))}
                    className="accent-amber-600 rounded cursor-pointer" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-xs"></span>
                    <span>Closed / Inactive</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.facilities_closed} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, facilities_closed: e.target.checked }))}
                    className="accent-rose-600 rounded cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            {/* Boundary Lines */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Spatial Boundaries</span>
              <div className="space-y-1.5 text-[11px] font-medium text-slate-700 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 bg-blue-900 rounded"></span>
                    <span>Level 2 Province Boundary</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.provinces} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, provinces: e.target.checked }))}
                    className="accent-emerald-600 rounded cursor-pointer" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 bg-blue-500 rounded border-dashed"></span>
                    <span>Level 3 District Boundary</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.districts} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, districts: e.target.checked }))}
                    className="accent-emerald-600 rounded cursor-pointer" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 bg-emerald-500 rounded"></span>
                    <span>Level 4 Ward Boundary</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.wards} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, wards: e.target.checked }))}
                    className="accent-emerald-600 rounded cursor-pointer" 
                  />
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 border border-white shadow-xs"></span>
                    <span>Health Offices (HQ)</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.healthOffices} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, healthOffices: e.target.checked }))}
                    className="accent-emerald-600 rounded cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            {/* Geographic Features */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 mt-2">Geographic Features</span>
              <div className="space-y-1.5 text-[11px] font-medium text-slate-700 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 bg-slate-500 rounded"></span>
                    <span>Major Roads</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.roads} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, roads: e.target.checked }))}
                    className="accent-slate-600 rounded cursor-pointer" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 bg-cyan-500 rounded"></span>
                    <span>Water Bodies / Rivers</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={visibleLayers.rivers} 
                    onChange={(e) => setVisibleLayers(prev => ({ ...prev, rivers: e.target.checked }))}
                    className="accent-cyan-600 rounded cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            {/* Labels Toggle Control */}
            <div className="pt-2 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Map Text Labels</span>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${showLabels ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showLabels ? 'Labels ON' : 'Labels OFF'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MapCenterManager = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapFitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], duration: 0.8 });
    }
  }, [bounds, map]);
  return null;
};

const MapFlyToFilterTarget = ({ filters, provinceBoundaries, districtBoundaries, wardBoundaries, filteredFacilities }) => {
  const map = useMap();
  const prevFilterKey = useRef('');

  useEffect(() => {
    if (!filters) return;
    const filterKey = `${filters.region_id}-${filters.province_id}-${filters.district_id}-${filters.ward_id}`;
    if (prevFilterKey.current === filterKey) return;
    prevFilterKey.current = filterKey;

    try {
      // 1. If Ward selected
      if (filters.ward_id && filters.ward_id !== 'all' && wardBoundaries?.features) {
        const targetWard = wardBoundaries.features.find(f => f.id == filters.ward_id || f.properties?.id == filters.ward_id);
        if (targetWard) {
          const bounds = L.geoJSON(targetWard).getBounds();
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
            return;
          }
        }
      }

      // 2. If District selected
      if (filters.district_id && filters.district_id !== 'all' && districtBoundaries?.features) {
        const targetDist = districtBoundaries.features.find(f => f.id == filters.district_id || f.properties?.id == filters.district_id);
        if (targetDist) {
          const bounds = L.geoJSON(targetDist).getBounds();
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [40, 40], duration: 1.5 });
            return;
          }
        }
      }

      // 3. If Province selected
      if (filters.province_id && filters.province_id !== 'all' && provinceBoundaries?.features) {
        const targetProv = provinceBoundaries.features.find(f => f.id == filters.province_id || f.properties?.id == filters.province_id);
        if (targetProv) {
          const bounds = L.geoJSON(targetProv).getBounds();
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [30, 30], duration: 1.5 });
            return;
          }
        }
      }

      // 4. Fallback: Fly to filtered facilities bounds
      if (filteredFacilities && filteredFacilities.length > 0 && (filters.province_id !== 'all' || filters.district_id !== 'all' || filters.ward_id !== 'all')) {
        const coords = filteredFacilities.filter(f => f.lat && f.lng).map(f => [f.lat, f.lng]);
        if (coords.length > 0) {
          const bounds = L.latLngBounds(coords);
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [40, 40], duration: 1.5 });
          }
        }
      }
    } catch (err) {
      console.error('Fly-in animation error:', err);
    }
  }, [filters, provinceBoundaries, districtBoundaries, wardBoundaries, filteredFacilities, map]);

  return null;
};

const MapRouteFitter = ({ selectedFacility, districtRoute, provincialRoute }) => {
  const map = useMap();
  useEffect(() => {
    if (!selectedFacility || !selectedFacility.lat || !selectedFacility.lng) return;
    
    let coords = [[selectedFacility.lat, selectedFacility.lng]];
    if (districtRoute && districtRoute.coords) coords = [...coords, ...districtRoute.coords];
    if (provincialRoute && provincialRoute.coords) coords = [...coords, ...provincialRoute.coords];
    
    if (districtRoute || provincialRoute) {
      const bounds = L.latLngBounds(coords);
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { 
          paddingTopLeft: [420, 120],
          paddingBottomRight: [450, 100],
          duration: 1.2
        });
      }
    } else {
      // Fallback if routes fail or haven't loaded yet
      map.flyTo([selectedFacility.lat, selectedFacility.lng], 13, { 
        duration: 1.2
      });
    }
  }, [selectedFacility, districtRoute, provincialRoute, map]);
  
  return null;
};

const MapCanvas = ({ onFacilitySelect, selectedFacility, mapFacilities, loading, filters, stats, onEditFacility }) => {
  const { theme } = useTheme();
  const [mapCenter, setMapCenter] = useState([-13.13, 27.84]);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [provinceBoundaries, setProvinceBoundaries] = useState(null);
  const [districtBoundaries, setDistrictBoundaries] = useState(null);
  const [wardBoundaries, setWardBoundaries] = useState(null);
  const [healthOffices, setHealthOffices] = useState([]);
  const [activeProvince, setActiveProvince] = useState(null);
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [districtRoute, setDistrictRoute] = useState(null);
  const [provincialRoute, setProvincialRoute] = useState(null);
  const [nationalRoute, setNationalRoute] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(6);
  
  // Interactive Labels & Layer Visibility Toggles
  const [showNetworkRoutes, setShowNetworkRoutes] = useState(true);
  const [isDetailPanelHidden, setIsDetailPanelHidden] = useState(false);

  useEffect(() => {
    // When a new facility is selected, ensure the panel is visible
    if (selectedFacility) {
      setIsDetailPanelHidden(false);
    }
  }, [selectedFacility]);
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState({
    facilities_operational: true,
    facilities_pending: true,
    facilities_closed: true,
    provinces: true,
    districts: true,
    wards: true,
    healthOffices: true,
    roads: false,
    rivers: false
  });

  const featureGroupRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (theme.defaultLat && theme.defaultLng) {
      setMapCenter([theme.defaultLat, theme.defaultLng]);
    }
  }, [theme.defaultLat, theme.defaultLng]);

  useEffect(() => {
    if (selectedFacility) {
      setIsDetailPanelHidden(false);
    }
  }, [selectedFacility]);

  useEffect(() => {
    const fetchBoundaries = async () => {
      try {
        const [provRes, distRes, wardRes, healthOfficesRes] = await Promise.all([
          api.get('/spatial/provinces'), 
          api.get('/spatial/districts'),
          api.get('/spatial/level4'),
          api.get('/spatial/health-offices')
        ]);
        setProvinceBoundaries(provRes.data);
        setDistrictBoundaries(distRes.data);
        setWardBoundaries(wardRes.data);
        setHealthOffices(healthOfficesRes.data.data || []);
      } catch (err) {
        console.error('Error loading boundaries:', err);
      }
    };
    fetchBoundaries();
  }, [theme.systemName]);

  // Fetch OSRM Road Routes when a facility is selected
  useEffect(() => {
    if (!selectedFacility || !selectedFacility.lat || !selectedFacility.lng || !healthOffices.length) {
      setDistrictRoute(null);
      setProvincialRoute(null);
      return;
    }

    const { nearestDistrictHQ, nearestProvincialHQ } = findNearestCapitals(
      selectedFacility.lat,
      selectedFacility.lng,
      healthOffices,
      selectedFacility.province,
      selectedFacility.district
    );

    const fetchRoute = async (startLat, startLng, endLat, endLng, setRouteState) => {
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes[0] && data.routes[0].geometry) {
          // OSRM returns coordinates in [lng, lat] format, Leaflet Polyline needs [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteState({ 
            coords,
            distance: data.routes[0].distance, // in meters
            duration: data.routes[0].duration  // in seconds
          });
        } else {
          setRouteState(null);
        }
      } catch (e) {
        console.error("Failed to fetch route", e);
        setRouteState(null);
      }
    };

    if (nearestDistrictHQ) {
      fetchRoute(selectedFacility.lat, selectedFacility.lng, nearestDistrictHQ.latitude, nearestDistrictHQ.longitude, setDistrictRoute);
    } else {
      setDistrictRoute(null);
    }

    if (nearestProvincialHQ) {
      fetchRoute(selectedFacility.lat, selectedFacility.lng, nearestProvincialHQ.latitude, nearestProvincialHQ.longitude, setProvincialRoute);
    } else {
      setProvincialRoute(null);
    }

    // National Capital Route (Lusaka coordinates roughly -15.4167, 28.2833)
    fetchRoute(selectedFacility.lat, selectedFacility.lng, -15.4167, 28.2833, setNationalRoute);

  }, [selectedFacility, healthOffices]);

  // Sync / Reset Map Boundaries when Sidebar Filters change
  useEffect(() => {
    if (!filters) return;
    if (filters.province_id === 'all') {
      setActiveProvince(null);
      setActiveDistrict(null);
    } else if (provinceBoundaries?.features) {
      const found = provinceBoundaries.features.find(f => f.id == filters.province_id || f.properties?.id == filters.province_id);
      if (found) {
        setActiveProvince(found.properties.name);
      }
    }
    if (filters.district_id === 'all') {
      setActiveDistrict(null);
    } else if (districtBoundaries?.features) {
      const found = districtBoundaries.features.find(f => f.id == filters.district_id || f.properties?.id == filters.district_id);
      if (found) {
        setActiveDistrict(found.properties.name);
      }
    }
  }, [filters, provinceBoundaries, districtBoundaries]);

  const mapBounds = useMemo(() => {
    if (!provinceBoundaries || !provinceBoundaries.features || provinceBoundaries.features.length === 0) return null;
    try {
      return L.geoJSON(provinceBoundaries).getBounds();
    } catch (e) {
      return null;
    }
  }, [provinceBoundaries]);

  const filteredDistricts = useMemo(() => {
    if (!districtBoundaries || !activeProvince) return null;
    return {
      ...districtBoundaries,
      features: districtBoundaries.features.filter(f => f.properties.province === activeProvince)
    };
  }, [districtBoundaries, activeProvince]);

  const filteredWards = useMemo(() => {
    if (!wardBoundaries || !activeDistrict) return null;
    return {
      ...wardBoundaries,
      features: wardBoundaries.features.filter(f => {
        if (!f.properties.district) return true;
        const wDist = (f.properties.district || '').replace('-', '').toLowerCase();
        const normDist = activeDistrict.replace('-', '').toLowerCase();
        return wDist === normDist;
      })
    };
  }, [wardBoundaries, activeDistrict]);

  const filteredFacilities = useMemo(() => {
    if (!mapFacilities) return [];
    let list = mapFacilities;
    if (activeProvince) {
      const normProv = activeProvince.replace('-', '').toLowerCase();
      list = list.filter(f => {
        const fProv = (f.province || f.region || '').replace('-', '').toLowerCase();
        return fProv === normProv;
      });
    }
    if (activeDistrict) {
      const normDist = activeDistrict.replace('-', '').toLowerCase();
      list = list.filter(f => (f.district || '').replace('-', '').toLowerCase() === normDist);
    }
    return list;
  }, [mapFacilities, activeProvince, activeDistrict]);

  const currentStats = useMemo(() => {
    return filteredFacilities.reduce((acc, f) => {
      const status = (f.operational_status || '').toLowerCase();
      if (status.includes('open') || status.includes('active') || status.includes('functional') || status.includes('operational')) acc.operational++;
      else if (status.includes('closed') || status.includes('inactive')) acc.closed++;
      else acc.pending++;
      return acc;
    }, { operational: 0, closed: 0, pending: 0 });
  }, [filteredFacilities]);

  const provinceStyle = (feature) => ({
    fillColor: activeProvince === feature.properties.name ? 'transparent' : '#0f2752',
    weight: 2,
    opacity: 1,
    color: 'white',
    fillOpacity: activeProvince ? 0 : 0.15
  });

  const districtStyle = {
    fillColor: '#3b82f6',
    weight: 1.5,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.25
  };

  const onProvinceClick = (feature, layer) => {
    setActiveProvince(feature.properties.name);
    setActiveDistrict(null);
    layer._map.fitBounds(layer.getBounds());
  };

  const onDistrictClick = (feature, layer) => {
    setActiveDistrict(feature.properties.name);
    layer._map.fitBounds(layer.getBounds());
  };

  const resetView = () => {
    setActiveProvince(null);
    setActiveDistrict(null);
  };

  const onEachFeature = (feature, layer, type) => {
    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ fillOpacity: 0.4, weight: 3, color: '#f59e0b' });
      },
      mouseout: (e) => {
        if (type === 'province') {
          e.target.setStyle(provinceStyle(feature));
        } else {
          e.target.setStyle(districtStyle);
        }
      },
      click: (e) => {
        if (type === 'province') {
          onProvinceClick(feature, e.target);
        } else {
          onDistrictClick(feature, e.target);
        }
      }
    });

    const isProvince = type === 'province';
    const isDistrict = type === 'district';
    
    // Smart label visibility rules
    const showBoundaryLabel = showLabels && (
      (isProvince && currentZoom >= 5) || 
      (isDistrict && currentZoom >= 7)
    );

    layer.bindTooltip(`<strong>${feature.properties.name}</strong>${isDistrict ? `<br/><span style="font-size:10px; color:#64748b">Province: ${feature.properties.province}</span>` : ''}`, {
      sticky: !showBoundaryLabel,
      permanent: showBoundaryLabel,
      direction: 'center',
      className: 'custom-tooltip'
    });
  };

  const ZoomTracker = () => {
    useMapEvents({
      zoomend: (e) => setCurrentZoom(e.target.getZoom()),
    });
    return null;
  };

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
      {/* Navigation Breadcrumbs & Controls */}
      <div className="absolute top-4 left-14 z-[1000] flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl border border-slate-200 flex items-center gap-2">
          <button 
            onClick={resetView}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${!activeProvince ? 'bg-slate-100 text-slate-400 cursor-default' : 'text-emerald-700 hover:bg-emerald-50'}`}
            title="Reset Map to National View"
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Zambia (National)</span>
          </button>

          {activeProvince && (
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
              <span className="text-slate-300">/</span>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">{activeProvince}</span>
              {activeDistrict && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">{activeDistrict}</span>
                </>
              )}
            </div>
          )}

          {/* Quick Labels Toggle Button */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`ml-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${showLabels ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title="Toggle Permanent Map Text Labels"
          >
            {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showLabels ? 'Labels ON' : 'Labels OFF'}</span>
          </button>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`ml-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${showLegend ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title="Toggle Map Legend"
          >
            <ListFilter className={`w-3.5 h-3.5 ${!showLegend && 'text-slate-500'}`} />
            <span>{showLegend ? 'Legend ON' : 'Legend OFF'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Stats Overlay */}
      <div className="absolute top-4 right-4 z-[1000]">
        <MapStatsCards 
          stats={currentStats} 
          theme={theme} 
          activeProvince={activeProvince} 
          activeDistrict={activeDistrict} 
          filteredCount={filteredFacilities.length} 
        />
      </div>

      {/* Floating Interactive Map Legend */}
      <MapLegend 
        showLabels={showLabels} 
        setShowLabels={setShowLabels} 
        visibleLayers={visibleLayers} 
        setVisibleLayers={setVisibleLayers}
        showLegend={showLegend}
      />


      <MapContainer center={mapCenter} zoom={zoomLevel} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <ZoomTracker />
        <ZoomControl position="bottomleft" />
        <ScaleControl position="bottomleft" imperial={false} />

        <MapFlyToFilterTarget 
          filters={filters} 
          provinceBoundaries={provinceBoundaries} 
          districtBoundaries={districtBoundaries} 
          wardBoundaries={wardBoundaries} 
          filteredFacilities={filteredFacilities} 
        />

        {/* Selected Facility Routes */}
        {selectedFacility && districtRoute && districtRoute.coords && (
          <Polyline positions={districtRoute.coords} pathOptions={{ color: '#0d9488', weight: 4, opacity: 0.9 }} />
        )}
        {selectedFacility && provincialRoute && provincialRoute.coords && (
          <Polyline positions={provincialRoute.coords} pathOptions={{ color: '#c026d3', weight: 4, opacity: 0.9 }} />
        )}

        <MapRouteFitter 
          selectedFacility={selectedFacility} 
          districtRoute={districtRoute} 
          provincialRoute={provincialRoute} 
        />

        {!activeProvince && mapBounds ? <MapFitBounds bounds={mapBounds} /> : (mapBounds ? null : <MapCenterManager center={mapCenter} zoom={zoomLevel} />)}

        
        {activeProvince && !activeDistrict && provinceBoundaries && (() => {
          const feature = provinceBoundaries.features.find(f => f.properties.name === activeProvince);
          if (feature) {
            try {
              return <MapFitBounds bounds={L.geoJSON(feature).getBounds()} />;
            } catch (e) { return null; }
          }
          return null;
        })()}
        
        {/* EXPANDED BASEMAP OPTIONS */}
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="🚀 Modern Canvas (Voyager)">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ OpenStreetMap Standard">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🛰️ Esri World Imagery (Satellite HD)">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri World Imagery' />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌙 CartoDB Dark Matter (Dark Mode)">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO Dark Matter' />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="☀️ CartoDB Positron (Light Mode)">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO Positron' />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="⛰️ OpenTopoMap (Topographic Terrain)">
            <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution='&copy; OpenTopoMap' />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌍 Esri World Topo Map">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri World Topo' />
          </LayersControl.BaseLayer>

          {showNetworkRoutes && (
          <LayersControl.Overlay checked name="Facility Routes">
            <FeatureGroup>
              {selectedFacility && districtRoute && districtRoute.coords && (
                <Polyline positions={districtRoute.coords} pathOptions={{ color: '#0d9488', weight: 4, opacity: 0.9 }} />
              )}
              {selectedFacility && provincialRoute && provincialRoute.coords && (
                <Polyline positions={provincialRoute.coords} pathOptions={{ color: '#ea580c', weight: 5, opacity: 0.9 }} />
              )}
              {selectedFacility && nationalRoute && nationalRoute.coords && (
                <Polyline positions={nationalRoute.coords} pathOptions={{ color: '#4f46e5', weight: 6, opacity: 0.9, dashArray: '10, 10' }} />
              )}
            </FeatureGroup>
          </LayersControl.Overlay>
        )}

          {/* FACILITY MARKERS LAYER */}
          {(visibleLayers.facilities_operational || visibleLayers.facilities_pending || visibleLayers.facilities_closed) && (
            <LayersControl.Overlay checked name="Facilities">
              <MarkerClusterGroup 
                disableClusteringAtZoom={16} 
                iconCreateFunction={createClusterCustomIcon}
                maxClusterRadius={50}
                showCoverageOnHover={false}
              >
                {filteredFacilities.filter(facility => {
                  const s = (facility.operational_status || '').toLowerCase();
                  const isOperational = s.includes('open') || s.includes('active') || s.includes('functional') || s.includes('operational');
                  const isClosed = s.includes('closed') || s.includes('inactive') || s.includes('non-functional');
                  if (isOperational) return visibleLayers.facilities_operational;
                  if (isClosed) return visibleLayers.facilities_closed;
                  return visibleLayers.facilities_pending;
                }).map(facility => (
                  <Marker 
                    key={facility.id} 
                    position={[facility.latitude || facility.lat, facility.longitude || facility.lng]}
                    icon={getFacilityIcon(facility.type, facility.operational_status)}
                    eventHandlers={{ click: () => onFacilitySelect(facility) }}
                  >
                    {showLabels && currentZoom >= 13 && (
                      <Tooltip permanent direction="top" offset={[0, -10]} className="custom-marker-label text-[10px] font-bold">
                        {facility.name}
                      </Tooltip>
                    )}
                    <Popup className="premium-popup">
                      <div className="p-1 min-w-[220px]">
                        <div className="mb-2">
                          <h4 className="font-black text-sm text-slate-800 m-0 leading-tight">{facility.name}</h4>
                          <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest">{facility.type}</span>
                        </div>
                        
                        <div className="space-y-1.5 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-bold uppercase">HMIS Code</span>
                            <span className="text-slate-700 font-black tracking-tight">{facility.code}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-bold uppercase">Status</span>
                            <span className={`font-black ${(facility.operational_status || '').toLowerCase().includes('open') ? 'text-emerald-600' : 'text-amber-600'}`}>{facility.operational_status}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-bold uppercase">Ownership</span>
                            <span className="text-slate-700 font-bold">{facility.ownership}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => navigate(`/facilities/${facility.id}`)}
                          className="w-full py-2 bg-primary text-white text-[11px] font-black rounded-xl hover:bg-primary-dark transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-external-link-alt text-[9px]"></i> VIEW FULL RECORD
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </LayersControl.Overlay>
          )}

          {/* LEVEL 2 PROVINCES LAYER */}
          {visibleLayers.provinces && (
            <LayersControl.Overlay checked={!activeProvince} name="Provinces">
              <FeatureGroup>
                {provinceBoundaries && <GeoJSON data={provinceBoundaries} style={provinceStyle} onEachFeature={(f, l) => onEachFeature(f, l, 'province')} />}
              </FeatureGroup>
            </LayersControl.Overlay>
          )}

          {/* LEVEL 3 DISTRICTS LAYER */}
          {visibleLayers.districts && (
            <LayersControl.Overlay checked={!!activeProvince && !activeDistrict} name="Districts">
              <FeatureGroup>
                {activeProvince && filteredDistricts && <GeoJSON key={activeProvince} data={filteredDistricts} style={districtStyle} onEachFeature={(f, l) => onEachFeature(f, l, 'district')} />}
              </FeatureGroup>
            </LayersControl.Overlay>
          )}

          {/* LEVEL 4 WARDS LAYER */}
          {visibleLayers.wards && (
            <LayersControl.Overlay checked={!!activeDistrict} name="Wards / Sub-Districts">
              <FeatureGroup>
                {activeDistrict && filteredWards && filteredWards.features && (
                  <GeoJSON 
                    key={`${activeDistrict}-${filteredWards.features.length}`} 
                    data={filteredWards} 
                    style={{
                      color: '#059669',
                      weight: 1.5,
                      fillColor: '#10b981',
                      fillOpacity: 0.35
                    }} 
                    onEachFeature={(f, l) => {
                      const showWardLabel = showLabels && currentZoom >= 10;
                      l.bindTooltip(`<strong>${f.properties.name || 'Ward'}</strong><br/><span style="font-size:10px; color:#64748b">Code: ${f.properties.code || 'N/A'}</span>`, { 
                        sticky: !showWardLabel,
                        permanent: showWardLabel,
                        direction: 'center' 
                      });
                    }} 
                  />
                )}
              </FeatureGroup>
            </LayersControl.Overlay>
          )}

          {/* HEALTH OFFICES (HQ) LAYER */}
          {visibleLayers.healthOffices && (
            <LayersControl.Overlay checked name="Health Offices (HQ)">
              <FeatureGroup>
                {healthOffices
                  .filter(office => currentZoom >= 7 || office.is_provincial_hq) // Hide district HQs when zoomed out
                  .map((office) => (
                  <Marker
                    key={`hq-${office.id}`}
                    position={[office.latitude, office.longitude]}
                    icon={office.is_provincial_hq ? getProvincialHQIcon() : getDistrictHQIcon()}
                  >
                    {showLabels && ((office.is_provincial_hq && currentZoom >= 6) || (!office.is_provincial_hq && currentZoom >= 8)) && (
                      <Tooltip permanent direction="bottom" offset={[0, 10]} className="bg-transparent border-0 shadow-none text-[10px] font-black text-slate-800 drop-shadow-md">
                        {office.office_name}
                      </Tooltip>
                    )}
                    <Popup className="premium-popup">
                      <div className="p-2 min-w-[200px]">
                        <h4 className="font-black text-sm text-slate-800 mb-1">{office.office_name}</h4>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {office.is_provincial_hq ? 'Provincial HQ' : 'District HQ'}
                        </span>
                        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                          <p><strong>Province:</strong> {office.province}</p>
                          <p><strong>District:</strong> {office.district || 'N/A'}</p>
                          <p><strong>Admin Centre:</strong> {office.administrative_centre || 'N/A'}</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </FeatureGroup>
            </LayersControl.Overlay>
          )}

          {visibleLayers.roads && (
            <LayersControl.Overlay checked name="Major Roads">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={0.6} />
            </LayersControl.Overlay>
          )}

          {visibleLayers.rivers && (
            <LayersControl.Overlay checked name="Water Bodies">
              <TileLayer url="https://tile.waymarkedtrails.org/riding/{z}/{x}/{y}.png" opacity={0.5} />
            </LayersControl.Overlay>
          )}
        </LayersControl>
        
        <MeasureControl />
      </MapContainer>

      {selectedFacility && !isDetailPanelHidden && (
        <div className="absolute right-0 top-0 bottom-0 z-[2000] h-full shadow-2xl animate-in slide-in-from-right-10 duration-300">
          <FacilityDetailPanel 
            facility={selectedFacility} 
            onClose={() => onFacilitySelect(null)} 
            onHide={() => setIsDetailPanelHidden(true)}
            onEdit={onEditFacility}
            districtRoute={districtRoute}
            provincialRoute={provincialRoute}
            nationalRoute={nationalRoute}
            capitals={healthOffices}
            onFlyToCoordinates={(coords, zoom) => {
              setMapCenter(coords);
              setZoomLevel(zoom);
            }} 
          />
        </div>
      )}

      {selectedFacility && isDetailPanelHidden && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-[2000]">
          <button 
            onClick={() => setIsDetailPanelHidden(false)}
            className="bg-card text-foreground px-2 py-4 rounded-l-xl shadow-xl border-y border-l border-border hover:bg-muted transition-colors flex items-center justify-center"
            title="Show Facility Details"
          >
            <Icon name="ChevronLeft" size={20} />
          </button>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-[2000]">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-xs font-black text-primary animate-pulse tracking-widest uppercase">Initializing Geospatial Data...</p>
        </div>
      )}
    </div>
  );
};

export default MapCanvas;