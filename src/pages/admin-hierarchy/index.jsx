import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Upload, MapPin, Map as MapIcon, ChevronRight, ChevronDown, Plus, CheckCircle2, AlertCircle, RefreshCw, FileUp, Edit2, Trash2, Settings, Eye, Check, X, ShieldAlert } from 'lucide-react';
import Sidebar, { SidebarProvider, useSidebar } from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import LanguageSelector from '../../components/navigation/LanguageSelector';
import NotificationBell from '../../components/navigation/NotificationBell';
import TenantSwitcher from '../../components/navigation/TenantSwitcher';
import { useTheme } from '../../components/ThemeProvider';
import api from '../../utils/api';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap, LayersControl, FeatureGroup, ScaleControl } from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapAutoFit = ({ geoJsonData, defaultLat, defaultLng }) => {
  const map = useMap();
  useEffect(() => {
    if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      try {
        const bounds = L.geoJSON(geoJsonData).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
          return;
        }
      } catch (e) {
        console.error('Error fitting bounds:', e);
      }
    }
    if (defaultLat && defaultLng) {
      map.setView([defaultLat, defaultLng], 6);
    }
  }, [geoJsonData, defaultLat, defaultLng, map]);
  return null;
};


const AdminHierarchyContent = () => {
  const { t } = useTranslation();
  const { isCollapsed } = useSidebar();
  const { theme } = useTheme();
  const [hierarchy, setHierarchy] = useState({
    level1_regions: [],
    level2_provinces: [],
    level3_districts: [],
    level4_wards: []
  });
  const [loading, setLoading] = useState(true);

  // Active level tab & selected features for GIS map
  const [activeLevelTab, setActiveLevelTab] = useState('level3'); // 'level1', 'level2', 'level3', 'level4'
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);

  // Upload Shapefile Modal & Inspection State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [targetLevel, setTargetLevel] = useState('3'); // 1=Region, 2=Province, 3=District, 4=Ward
  const [selectedFile, setSelectedFile] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspection, setInspection] = useState(null);
  
  // Custom Field Mapping & Import Mode
  const [nameField, setNameField] = useState('');
  const [codeField, setCodeField] = useState('auto');
  const [popField, setPopField] = useState('none');
  const [importMode, setImportMode] = useState('upsert'); // 'upsert' | 'append_only'

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [uploadMessage, setUploadMessage] = useState(null);

  // Edit Boundary Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBoundary, setEditingBoundary] = useState(null);
  const [savingBoundary, setSavingBoundary] = useState(false);

  useEffect(() => {
    fetchHierarchy();
    fetchGeoJson('level3');
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const res = await api.get('/spatial/hierarchy');
      if (res.data && res.data.success) {
        setHierarchy(res.data.data || {});
      }
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeoJson = async (levelKey) => {
    try {
      setLoadingMap(true);
      const res = await api.get(`/spatial/${levelKey}`);
      setGeoJsonData(res.data);
    } catch (err) {
      console.error(`Error fetching ${levelKey} GeoJSON:`, err);
    } finally {
      setLoadingMap(false);
    }
  };

  const handleLevelTabChange = (levelKey) => {
    setActiveLevelTab(levelKey);
    setGeoJsonData(null);
    fetchGeoJson(levelKey);
  };

  // Inspect shapefile on file pick
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setInspection(null);
    setUploadMessage(null);
    setUploadProgress(0);
    setProcessingStage('');
    if (!file) return;

    try {
      setInspecting(true);
      const formData = new FormData();
      formData.append('shapefile', file);

      const res = await api.post('/spatial/inspect-shapefile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        setInspection(res.data);
        setNameField(res.data.suggestedNameField || '');
        setCodeField(res.data.suggestedCodeField || 'auto');
        setPopField(res.data.suggestedPopField || 'none');
      }
    } catch (err) {
      console.error('Error inspecting shapefile:', err);
      setUploadMessage({ type: 'error', text: 'File inspection failed: ' + (err.response?.data?.message || err.message) });
    } finally {
      setInspecting(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadMessage(null);
      setUploadProgress(10);
      setProcessingStage('Step 1/4: Uploading shapefile bytes to server...');

      const formData = new FormData();
      formData.append('shapefile', selectedFile);
      formData.append('target_level', targetLevel);
      formData.append('name_field', nameField);
      formData.append('code_field', codeField);
      formData.append('pop_field', popField);
      formData.append('mode', importMode);

      const res = await api.post('/spatial/upload-shapefile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setUploadProgress(Math.max(percent, 15));
            if (percent > 40) {
              setProcessingStage('Step 2/4: Parsing spatial features & mapping fields...');
            }
          }
        }
      });

      setUploadProgress(85);
      setProcessingStage('Step 3/4: Upserting boundary geometries into PostGIS...');

      if (res.data && res.data.success) {
        setUploadProgress(100);
        setProcessingStage('Step 4/4: Completed spatial linking & PostGIS indexing!');
        setUploadMessage({ type: 'success', text: res.data.message });
        setSelectedFile(null);
        setInspection(null);
        fetchHierarchy();
        fetchGeoJson(activeLevelTab);
      }
    } catch (err) {
      console.error('Error uploading shapefile:', err);
      setUploadMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setProcessingStage('');
      }, 1200);
    }
  };


  const handleSaveBoundary = async (e) => {
    e.preventDefault();
    if (!editingBoundary) return;
    try {
      setSavingBoundary(true);
      const levelNum = activeLevelTab === 'level1' ? 1 : activeLevelTab === 'level2' ? 2 : activeLevelTab === 'level3' ? 3 : 4;
      await api.put(`/spatial/boundaries/${levelNum}/${editingBoundary.id}`, {
        name: editingBoundary.name,
        code: editingBoundary.code,
        population: editingBoundary.population
      });
      setEditModalOpen(false);
      setEditingBoundary(null);
      fetchHierarchy();
      fetchGeoJson(activeLevelTab);
    } catch (err) {
      console.error('Error updating boundary:', err);
      alert('Failed to update boundary: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingBoundary(false);
    }
  };

  const handleDeleteBoundary = async (b) => {
    if (!window.confirm(`Are you sure you want to delete boundary "${b.name}" (${b.code})? This action will safely remove the geometry record.`)) return;
    try {
      const levelNum = activeLevelTab === 'level1' ? 1 : activeLevelTab === 'level2' ? 2 : activeLevelTab === 'level3' ? 3 : 4;
      await api.delete(`/spatial/boundaries/${levelNum}/${b.id}`);
      fetchHierarchy();
      fetchGeoJson(activeLevelTab);
    } catch (err) {
      console.error('Error deleting boundary:', err);
      alert('Failed to delete boundary: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleClearLevelBoundaries = async (levelNum, levelName) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to clear ALL loaded shapefiles/boundaries for ${levelName} (Level ${levelNum})? This will delete all stored geometries for this level so you can re-upload a fresh shapefile.`)) return;

    try {
      setLoading(true);
      const res = await api.delete(`/spatial/level/${levelNum}`);
      if (res.data && res.data.success) {
        alert(`Success: ${res.data.message}`);
        fetchHierarchy();
        fetchGeoJson(activeLevelTab);
      }
    } catch (err) {
      console.error(`Error clearing Level ${levelNum} shapefiles:`, err);
      alert('Failed to clear level shapefiles: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const currentLevelBoundaries = 
    activeLevelTab === 'level1' ? hierarchy.level1_regions :
    activeLevelTab === 'level2' ? hierarchy.level2_provinces :
    activeLevelTab === 'level3' ? hierarchy.level3_districts :
    hierarchy.level4_wards;


  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <MobileMenuButton />

      <div className={`flex-1 flex flex-col h-screen overflow-hidden relative z-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              4-Level Administrative Hierarchy & Shapefile Manager
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSelector />
            <TenantSwitcher />
            <NotificationBell />
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner Actions & KPI Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Spatial Administrative Boundaries</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Manage 4-level administrative boundary polygons, custom field mappings, and seamless non-destructive shapefile replacements.
              </p>
            </div>

            <button
              onClick={() => {
                setShowUploadModal(true);
                setInspection(null);
                setSelectedFile(null);
                setUploadMessage(null);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Shapefile / GeoJSON</span>
            </button>
          </div>

          {/* 4-Level KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeLevelTab === 'level1' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-md' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800'}`} onClick={() => handleLevelTabChange('level1')}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Level 1</span>
                <MapIcon className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{hierarchy.level1_regions.length}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Countries / Regions</p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeLevelTab === 'level2' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-md' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800'}`} onClick={() => handleLevelTabChange('level2')}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Level 2</span>
                <Layers className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{hierarchy.level2_provinces.length}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Provinces / States</p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeLevelTab === 'level3' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-md' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800'}`} onClick={() => handleLevelTabChange('level3')}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Level 3</span>
                <MapPin className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{hierarchy.level3_districts.length}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Districts</p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeLevelTab === 'level4' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-md' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800'}`} onClick={() => handleLevelTabChange('level4')}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Level 4</span>
                <Layers className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{hierarchy.level4_wards.length}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Wards / Sub-Districts</p>
            </div>
          </div>

          {/* Interactive GIS Spatial Preview Map */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                  {activeLevelTab === 'level1' ? 'Level 1: Country / Region' :
                   activeLevelTab === 'level2' ? 'Level 2: Province' :
                   activeLevelTab === 'level3' ? 'Level 3: District' : 'Level 4: Ward / Sub-District'} Spatial Map Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Polygons loaded directly from PostGIS spatial boundary features.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
                <button onClick={() => handleLevelTabChange('level1')} className={`px-3 py-1.5 rounded-lg transition-all ${activeLevelTab === 'level1' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow' : 'text-slate-600 dark:text-gray-400'}`}>Level 1</button>
                <button onClick={() => handleLevelTabChange('level2')} className={`px-3 py-1.5 rounded-lg transition-all ${activeLevelTab === 'level2' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow' : 'text-slate-600 dark:text-gray-400'}`}>Level 2</button>
                <button onClick={() => handleLevelTabChange('level3')} className={`px-3 py-1.5 rounded-lg transition-all ${activeLevelTab === 'level3' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow' : 'text-slate-600 dark:text-gray-400'}`}>Level 3</button>
                <button onClick={() => handleLevelTabChange('level4')} className={`px-3 py-1.5 rounded-lg transition-all ${activeLevelTab === 'level4' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow' : 'text-slate-600 dark:text-gray-400'}`}>Level 4</button>
              </div>
            </div>

            <div className="h-[380px] rounded-xl overflow-hidden border border-slate-200 dark:border-gray-800 relative z-0">
              {loadingMap && (
                <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xs z-10 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading Leaflet GIS Layer...</span>
                  </div>
                </div>
              )}

              <MapContainer center={[theme?.defaultLat || -13.13, theme?.defaultLng || 27.84]} zoom={6} className="h-full w-full">
                <ScaleControl position="bottomleft" imperial={false} />
                <MapAutoFit geoJsonData={geoJsonData} defaultLat={theme?.defaultLat} defaultLng={theme?.defaultLng} />

                <LayersControl position="bottomright">
                  <LayersControl.BaseLayer checked name="🗺️ OpenStreetMap Standard">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="🚀 Modern Voyager">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="🛰️ Satellite HD">
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri" />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="🌙 Dark Mode">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
                  </LayersControl.BaseLayer>

                  <LayersControl.Overlay checked name="Administrative Boundaries">
                    <FeatureGroup>
                      {geoJsonData && (
                        <GeoJSON
                          key={`${activeLevelTab}-${geoJsonData.features?.length || 0}`}
                          data={geoJsonData}
                          style={{
                            color: '#059669',
                            weight: 2,
                            fillColor: '#10b981',
                            fillOpacity: 0.25
                          }}
                          onEachFeature={(feature, layer) => {
                            layer.bindTooltip(`<strong>${feature.properties.name || 'Boundary'}</strong><br/><span style="font-size:10px; color:#64748b;">Code: ${feature.properties.code || 'N/A'}</span>`, { sticky: true });
                            layer.bindPopup(`
                              <div style="font-size:12px; font-weight:bold;">
                                ${feature.properties.name || 'Boundary'}
                                <br/><span style="font-weight:normal; color:#64748b;">Code: ${feature.properties.code || 'N/A'}</span>
                              </div>
                            `);
                          }}
                        />
                      )}
                    </FeatureGroup>
                  </LayersControl.Overlay>
                </LayersControl>
              </MapContainer>

            </div>
          </div>

          {/* Active Level Boundary Registry Data Table */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {activeLevelTab === 'level1' ? 'Level 1: Countries & Regions' :
                   activeLevelTab === 'level2' ? 'Level 2: Provinces & States' :
                   activeLevelTab === 'level3' ? 'Level 3: Districts' : 'Level 4: Wards & Sub-Districts'} Registry ({currentLevelBoundaries.length} Loaded Boundaries)
                </h3>
                <p className="text-xs text-slate-500">View, edit individual boundary attributes, or wipe/replace entire shapefile level.</p>
              </div>

              {currentLevelBoundaries.length > 0 && (
                <button
                  onClick={() => {
                    const levelNum = activeLevelTab === 'level1' ? 1 : activeLevelTab === 'level2' ? 2 : activeLevelTab === 'level3' ? 3 : 4;
                    const levelName = activeLevelTab === 'level1' ? 'Regions' : activeLevelTab === 'level2' ? 'Provinces' : activeLevelTab === 'level3' ? 'Districts' : 'Wards';
                    handleClearLevelBoundaries(levelNum, levelName);
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800 flex items-center space-x-1.5 shrink-0"
                  title="Wipe & Clear all shapefiles for this level"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe & Replace Level Shapefiles</span>
                </button>
              )}
            </div>


            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 font-semibold border-b border-slate-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Boundary Name</th>
                    {activeLevelTab === 'level4' && <th className="px-4 py-3">Population</th>}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 text-xs">
                  {currentLevelBoundaries.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-slate-400">
                        No boundaries found for this level. Click "Upload Shapefile" above to import boundaries.
                      </td>
                    </tr>
                  ) : (
                    currentLevelBoundaries.slice(0, 30).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">{b.code || `SPAT_${b.id}`}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{b.name}</td>
                        {activeLevelTab === 'level4' && (
                          <td className="px-4 py-3 text-slate-500 font-mono">{(b.population || 0).toLocaleString()}</td>
                        )}
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingBoundary(b);
                              setEditModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center space-x-1"
                            title="Edit Boundary Name & Code"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBoundary(b)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center space-x-1"
                            title="Delete Boundary"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* REPLACABLE & EDITABLE SHAPEFILE UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Spatial Shapefile Upload & Field Mapper</h3>
                <p className="text-xs text-slate-500">Configure property field mappings and select non-destructive replace/upsert mode.</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {uploadMessage && (
              <div className={`p-3 rounded-lg text-xs font-medium ${
                uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {uploadMessage.text}
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Target Administrative Level</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-semibold"
                  >
                    <option value="1">Level 1: Country / Region</option>
                    <option value="2">Level 2: Province / State</option>
                    <option value="3">Level 3: District</option>
                    <option value="4">Level 4: Ward / LLG / Sub-District</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Upload Mode</label>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    <option value="upsert">🔄 Replace / Upsert Matching Boundaries (Recommended)</option>
                    <option value="append_only">➕ Append Only (Do Not Replace Existing)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Select File (.zip containing Shapefile or .geojson)</label>
                <input
                  type="file"
                  required
                  accept=".zip,.json,.geojson"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                <p className="text-[10px] text-slate-400 mt-1">Supports Shapefiles (.shp inside .zip) or GeoJSON files.</p>
              </div>

              {inspecting && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 rounded-xl text-xs font-medium flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Inspecting shapefile feature attributes and property keys...</span>
                </div>
              )}

              {/* REAL-TIME SHAPEFILE PROCESSING PROGRESS BAR */}
              {uploading && (
                <div className="bg-slate-50 dark:bg-gray-800 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-3 animate-in fade-in duration-300 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>{processingStage || 'Processing shapefile features...'}</span>
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {uploadProgress}%
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden relative shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                      style={{ width: `${Math.max(uploadProgress, 8)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                    <span>Level {targetLevel} Boundary Ingestion</span>
                    <span>{inspection?.totalFeatures ? `${inspection.totalFeatures} Features` : 'PostGIS Geometry Processing'}</span>
                  </div>
                </div>
              )}


              {/* INSPECTION FIELD MAPPING SECTION */}
              {inspection && (
                <div className="bg-slate-50 dark:bg-gray-800/60 p-4 rounded-xl border border-slate-200 dark:border-gray-700 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-700 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center space-x-1.5">
                      <Settings className="w-4 h-4 text-emerald-600" />
                      <span>Configure Shapefile Field Mapping ({inspection.totalFeatures} features detected)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">
                        Map Name Field <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={nameField}
                        onChange={(e) => setNameField(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-xs font-medium"
                      >
                        {inspection.fields.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Field containing the boundary name to show on map.</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">
                        Map Code Field
                      </label>
                      <select
                        value={codeField}
                        onChange={(e) => setCodeField(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-xs font-medium"
                      >
                        <option value="auto">Auto-Generate Code</option>
                        {inspection.fields.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Unique code field for boundary identity.</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">
                        Population Field
                      </label>
                      <select
                        value={popField}
                        onChange={(e) => setPopField(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-xs font-medium"
                      >
                        <option value="none">None / Default 0</option>
                        {inspection.fields.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Optional population column.</p>
                    </div>
                  </div>

                  {/* Feature Mapping Live Preview Table */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Mapping Preview (First {inspection.sampleFeatures.length} features)</span>
                    </h4>
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-700 overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 font-bold border-b">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Parsed Boundary Name</th>
                            <th className="px-3 py-2">Parsed Code</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700 dark:text-gray-300">
                          {inspection.sampleFeatures.map((sf) => (
                            <tr key={sf.index}>
                              <td className="px-3 py-1.5 font-mono text-slate-400">{sf.index}</td>
                              <td className="px-3 py-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                                {sf.properties[nameField] || <span className="text-red-400 italic">Undefined</span>}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-slate-600 dark:text-gray-400">
                                {codeField === 'auto' ? `Auto: SPAT_${sf.index}` : (sf.properties[codeField] || 'N/A')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || inspecting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow flex items-center space-x-1.5"
                >
                  <FileUp className="w-4 h-4" />
                  <span>{uploading ? 'Processing Spatial Replacement...' : 'Import & Replace Boundaries'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BOUNDARY MODAL */}
      {editModalOpen && editingBoundary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Boundary Details</h3>
              <button onClick={() => setEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveBoundary} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Boundary Name</label>
                <input
                  type="text"
                  required
                  value={editingBoundary.name || ''}
                  onChange={(e) => setEditingBoundary({ ...editingBoundary, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Boundary Code</label>
                <input
                  type="text"
                  required
                  value={editingBoundary.code || ''}
                  onChange={(e) => setEditingBoundary({ ...editingBoundary, code: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-mono font-medium"
                />
              </div>

              {activeLevelTab === 'level4' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Population</label>
                  <input
                    type="number"
                    value={editingBoundary.population || 0}
                    onChange={(e) => setEditingBoundary({ ...editingBoundary, population: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-mono font-medium"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBoundary}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingBoundary ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminHierarchyPage = () => {
  return (
    <SidebarProvider>
      <AdminHierarchyContent />
    </SidebarProvider>
  );
};

export default AdminHierarchyPage;
