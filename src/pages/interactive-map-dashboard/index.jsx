import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import IntegrationHealthMonitor from '../../components/navigation/IntegrationHealthMonitor';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FilterSidebar from './components/FilterSidebar';
import MapCanvas from './components/MapCanvas';
import SearchBar from './components/SearchBar';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import ExportModal from './components/ExportModal';
import api from '../../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const DashboardContent = () => {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all', status: 'all', region_id: 'all', province_id: 'all', district_id: 'all',
    only_gps: false, only_photos: false, only_non_functional: false
  });
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/facilities/public');
        const facilitiesData = response.data || [];
        const mappedFacilities = facilitiesData.map(f => {
          const rawStatus = (f.operational_status || '').toLowerCase();
          let statusCategory = 'pending';
          if (rawStatus.includes('open') || rawStatus.includes('active') || rawStatus.includes('functional') || rawStatus.includes('operational')) statusCategory = 'operational';
          else if (rawStatus.includes('closed') || rawStatus.includes('inactive') || rawStatus.includes('non-functional')) statusCategory = 'closed';

          return {
            ...f,
            lat: f.latitude && !isNaN(parseFloat(f.latitude)) ? parseFloat(f.latitude) : null,
            lng: f.longitude && !isNaN(parseFloat(f.longitude)) ? parseFloat(f.longitude) : null,
            status: f.operational_status || 'Unknown',
            status_category: statusCategory,
            type: f.type || 'Unknown'
          };
        });
        setFacilities(mappedFacilities);
      } catch (err) {
        console.error("Error fetching map data:", err);
        setError("Failed to load facilities. Please verify your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  const filteredFacilities = facilities.filter((facility) => {
    if (filters?.type && filters?.type !== 'all' && facility?.type !== filters?.type) return false;
    if (filters?.status && filters?.status !== 'all' && facility.status_category !== filters.status) return false;
    if (filters?.region_id && filters?.region_id !== 'all' && facility?.region_id != filters?.region_id) return false;
    if (filters?.province_id && filters?.province_id !== 'all' && facility?.province_id != filters?.province_id) return false;
    if (filters?.district_id && filters?.district_id !== 'all' && facility?.district_id != filters?.district_id) return false;
    if (filters?.ward_id && filters?.ward_id !== 'all' && facility?.ward_id != filters?.ward_id) return false;
    if (filters?.only_gps && (facility.lat === null || facility.lng === null)) return false;

    if (filters?.search_query) {
      const q = filters.search_query.toLowerCase();
      return (facility.name || '').toLowerCase().includes(q) || (facility.province || '').toLowerCase().includes(q) || (facility.district || '').toLowerCase().includes(q);
    }
    return true;
  });

  const filteredMapFacilities = filteredFacilities.filter(f => f.lat !== null && f.lng !== null);
  const stats = filteredFacilities.reduce((acc, f) => {
    const cat = f.status_category;
    if (cat === 'operational') acc.operational++;
    else if (cat === 'closed') acc.closed++;
    else acc.pending++;
    return acc;
  }, { operational: 0, closed: 0, pending: 0, total: filteredFacilities.length, mapped: filteredMapFacilities.length, coverage: 0 });
  stats.coverage = stats.total > 0 ? Math.round((stats.mapped / stats.total) * 100) : 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <MobileMenuButton />
      <div className={`main-content flex-1 flex flex-col ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="bg-card border-b border-border p-4 relative z-50">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name="Map" size={20} className="text-primary" /></div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Facilities Map</h1>
                <p className="text-sm text-muted-foreground">Master Facility List (MFL) Geospatial Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IntegrationHealthMonitor /><WorkflowStatusIndicator isFixed={false} />
              <Button variant="outline" iconName="Download" iconPosition="left" onClick={() => setShowExportModal(true)}>Export</Button>
              <Button variant="default" iconName="Plus" iconPosition="left" onClick={() => navigate('/facility-editor-form')}>Add Facility</Button>
            </div>
          </div>
          <SearchBar onSearch={(q) => setFilters(p => ({...p, search_query: q}))} />
        </div>
        <div className="flex-1 flex overflow-hidden relative z-0">
          <FilterSidebar onFilterChange={setFilters} isCollapsed={isFilterCollapsed} onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)} />
          <div className="flex-1 p-4 relative">
            {error && <div className="absolute top-4 left-4 right-4 z-50 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-bold flex items-center gap-2"><Icon name="AlertCircle" size={16} />{error}</div>}
            <MapCanvas 
              selectedFacility={selectedFacility} 
              onFacilitySelect={setSelectedFacility} 
              filters={filters} 
              drawingMode={drawingMode} 
              onDrawingComplete={setDrawingMode} 
              facilities={filteredFacilities} 
              mapFacilities={filteredMapFacilities} 
              stats={stats} 
              loading={loading} 
              onEditFacility={() => navigate(`/facilities/${selectedFacility.id}`)}
            />
          </div>
        </div>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={() => {}} />
    </div>
  );
};

const InteractiveMapDashboard = () => <SidebarProvider><DashboardContent /></SidebarProvider>;
export default InteractiveMapDashboard;