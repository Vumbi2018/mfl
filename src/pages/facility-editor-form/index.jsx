import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { SidebarProvider } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import IntegrationHealthMonitor from '../../components/navigation/IntegrationHealthMonitor';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FacilityHierarchy from './components/FacilityHierarchy';
import ApprovalWorkflowStatus from './components/ApprovalWorkflowStatus';
import ChangeHistory from './components/ChangeHistory';
import GPSCoordinatesWidget from './components/GPSCoordinatesWidget';
import LocationPicker from './components/LocationPicker';
import PhotoUploadQueue from './components/PhotoUploadQueue';
import AIValidationSuggestions from './components/AIValidationSuggestions';
import BasicInfoForm from './components/BasicInfoForm';
import LocationBoundariesForm from './components/LocationBoundariesForm';
import ServicesCapacityForm from './components/ServicesCapacityForm';
import StaffEquipmentForm from './components/StaffEquipmentForm';
import FacilityDetailsSummary from './components/FacilityDetailsSummary';

const FacilityEditorForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [locationData, setLocationData] = useState([]);

  // User & Permission State
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = user.permissions || [];
  const jurisdictions = user.jurisdictions || [];
  const hasEditPermission = permissions.includes('edit_facility') || user.is_national || ['NATIONAL_ADMIN', 'ADMIN'].includes(user.role_name);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const locResponse = await api.get('/facilities/locations');
        setLocationData(locResponse.data);
      } catch (err) { console.error("Error:", err); }
    };
    fetchReferenceData();

    if (id) {
      const fetchFacility = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/facilities/${id}`);
          const data = response.data;
          if (data.boundary_geojson) {
              try {
                  const geo = JSON.parse(data.boundary_geojson);
                  if (geo.type === 'Polygon' && geo.coordinates && geo.coordinates[0]) {
                      // GeoJSON is [lng, lat], map expects [lat, lng]
                      data.boundary_polygon = geo.coordinates[0].map(p => [p[1], p[0]]);
                  }
              } catch(e) {}
          }
          setFormData(data);
          // SMART PERMISSION CHECK
          if (!hasEditPermission) {
            setCanEdit(false);
          } else if (!user.is_national && user.role_name !== 'NATIONAL_ADMIN') {
            const isScoped = jurisdictions.some(j => 
              (j.district_id && data.district_id === j.district_id) ||
              (j.province_id && data.province_id === j.province_id)
            );
            if (!isScoped && jurisdictions.length > 0) setCanEdit(false);
          }
        } catch (err) { setError("Failed to load facility."); }
        finally { setLoading(false); }
      };
      fetchFacility();
    } else {
      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      if (lat && lng) {
        setFormData(prev => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lng) }));
        setActiveTab('location');
      }
    }
  }, [id]);

  const handleSave = async () => {
    if (!canEdit) return;
    setIsSaving(true);
    try {
      if (id) await api.put(`/facilities/${id}`, formData);
      else {
        const res = await api.post('/facilities', formData);
        navigate(`/facilities/${res.data.id}`, { replace: true });
      }
      setLastSaved(new Date());
    } catch (err) { setSaveError("Failed to save."); }
    finally { setIsSaving(false); }
  };

  const renderTabContent = () => {
    const props = { formData, onChange: (f, v) => setFormData(p => ({...p, [f]: v})), readOnly: !canEdit };
    switch (activeTab) {
      case 'basic': return <BasicInfoForm {...props} />;
      case 'location': return <LocationBoundariesForm {...props} locationData={locationData} />;
      case 'services': return <ServicesCapacityForm {...props} />;
      case 'staff': return <StaffEquipmentForm {...props} />;
      default: return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileMenuButton />
        <main className="main-content">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{id ? 'Facility Editor' : 'Register New Facility'} {!canEdit && <span className="ml-2 text-sm bg-slate-100 text-slate-500 px-2 py-1 rounded font-normal">(View Only)</span>}</h1>
                <p className="text-sm text-muted-foreground">Manage comprehensive health facility records</p>
              </div>
              <div className="flex items-center gap-3">
                <IntegrationHealthMonitor /><WorkflowStatusIndicator isFixed={false} />
                {canEdit && (
                  <>
                    <Button variant="outline" iconName="Save" onClick={handleSave} loading={isSaving}>Save Draft</Button>
                    <Button variant="default" iconName="Send" onClick={() => {}}>Submit for Approval</Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="col-span-1 lg:col-span-3 space-y-4">
                {id && <FacilityDetailsSummary facility={formData} />}
                <FacilityHierarchy facility={formData} locationData={locationData} />
                <ApprovalWorkflowStatus workflowStatus={{ district: 'approved', province: 'approved', national: 'approved' }} />
                <ChangeHistory facilityId={id} />
              </div>

              <div className="col-span-1 lg:col-span-6">
                <div className="bg-card border border-border rounded-lg">
                  <div className="border-b border-border p-2 flex gap-1 overflow-x-auto">
                    {['basic', 'location', 'services', 'staff'].map(t => (
                      <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="p-6">{renderTabContent()}</div>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-3 space-y-4">
                <LocationPicker latitude={formData.latitude} longitude={formData.longitude} onLocationChange={canEdit ? (c) => setFormData(p => ({...p, latitude: c.lat, longitude: c.lng})) : null} />
                <PhotoUploadQueue photos={formData.photos} onPhotosChange={canEdit ? (p) => setFormData(pr => ({...pr, photos: p})) : null} />
                {canEdit && <AIValidationSuggestions formData={formData} onApply={(f, v) => setFormData(p => ({...p, [f]: v}))} />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default FacilityEditorForm;