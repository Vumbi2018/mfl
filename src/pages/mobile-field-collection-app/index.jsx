import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FacilitySearchCard from './components/FacilitySearchCard';
import QuickDataEntryForm from './components/QuickDataEntryForm';
import GPSCaptureCard from './components/GPSCaptureCard';
import PhotoCaptureCard from './components/PhotoCaptureCard';
import OfflineSyncStatus from './components/OfflineSyncStatus';
import VoiceInputCard from './components/VoiceInputCard';
import BulkCollectionCard from './components/BulkCollectionCard';
import QualityAssuranceCard from './components/QualityAssuranceCard';

import api from '../../utils/api';

const MobileFieldCollectionApp = () => {
  const [activeView, setActiveView] = useState('search');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [formData, setFormData] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Sync State
  const [syncQueue, setSyncQueue] = useState(() => {
    const saved = localStorage.getItem('mfl_sync_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Persist Queue
  useEffect(() => {
    localStorage.setItem('mfl_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Handle draft state to prevent data loss when switching tabs
  const [draftData, setDraftData] = useState({});

  const handleSelectFacility = (facility) => {
    setSelectedFacility(facility);
    // Initialize draft with facility data
    setDraftData({
      name: facility.name || facility.common_name || '',
      type: facility.type || facility.facility_type || '',
      operational_status: facility.operational_status || facility.status || 'Operational',
      region_id: facility.region_id?.toString() || '',
      province_id: facility.province_id?.toString() || '',
      district_id: facility.district_id?.toString() || '',
      llg_id: facility.llg_id?.toString() || '',
      ward_id: facility.ward_id?.toString() || '',
      operating_hours: facility.operational_hours || facility.operating_hours || '',
      total_beds: facility.total_beds || facility.bedCapacity || '',
      total_staff: facility.total_staff || facility.staffCount || '',
      emergency_services: facility.emergency_services || false,
      has_ambulance: facility.has_ambulance || facility.ambulance_available || false,
      services: Array.isArray(facility.services) ? facility.services : []
    });
    setActiveView('dataEntry');
  };

  const handleDraftUpdate = (newData) => {
    setDraftData(newData);
  };

  const handleFormSubmit = (data) => {
    // Validation
    const errors = [];
    if (!data?.name?.trim()) errors.push("Facility Name is required");
    if (!data?.type) errors.push("Facility Type is required");
    if (!data?.region_id) errors.push("Region is required");
    if (!data?.province_id) errors.push("Province is required");
    if (!data?.district_id) errors.push("District is required");

    if (errors.length > 0) {
      alert(`Please complete the form:\n- ${errors.join('\n- ')}`);
      setActiveView('dataEntry'); // Switch back to form so they can fix it
      return;
    }

    const newItem = {
      id: Date.now(), // Temp ID
      type: 'facility_update',
      facilityId: selectedFacility?.id, // Assuming selectedFacility has ID
      payload: {
        ...data,
        // Merge GPS if available and relevant
        ...(gpsData ? { latitude: gpsData.latitude, longitude: gpsData.longitude } : {})
      },
      timestamp: new Date().toISOString()
    };

    // Add photos to payload or handle separate upload logic later
    if (photos.length > 0) {
      newItem.payload.photos = photos; // In real app, upload files first then attach URLs, or send FormData
    }

    setSyncQueue(prev => [...prev, newItem]);
    setFormData(data);
    setShowSuccessModal(true);

    setTimeout(() => {
      setShowSuccessModal(false);
      setActiveView('search');
      setSelectedFacility(null);
      setFormData(null);
      setGpsData(null);
      setPhotos([]);
      setDraftData({});
    }, 2000);
  };

  const handleSync = async () => {
    if (syncQueue.length === 0) return;

    setIsSyncing(true);
    const successfulIds = [];

    try {
      // Process each item in queue
      // In a real app, might want to batch this or use a more robust queue manager
      for (const item of syncQueue) {
        try {
          if (item.type === 'facility_update') {
            // Assuming we have an update endpoint
            // If new facility: POST /facilities
            // If existing: PUT /facilities/:id

            if (item.facilityId) {
              await api.put(`/facilities/${item.facilityId}`, item.payload);
            } else {
              // Create new facility
              await api.post('/facilities', item.payload);
            }
          }
          successfulIds.push(item.id);
        } catch (err) {
          console.error("Sync error for item:", item, err);
          // Keep in queue if failed
        }
      }
    } catch (err) {
      console.error("Global sync error:", err);
    } finally {
      // Remove successful items from queue
      setSyncQueue(prev => prev.filter(item => !successfulIds.includes(item.id)));
      setLastSyncTime(new Date());
      setIsSyncing(false);
    }
  };


  const handleGPSCapture = (coordinates) => {
    setGpsData(coordinates);
  };

  const handlePhotosCapture = (capturedPhotos) => {
    setPhotos(capturedPhotos);
  };

  const handleVoiceTranscript = (transcript) => {
    console.log('Voice transcript:', transcript);
  };

  const handleBulkSubmit = (bulkData) => {
    console.log('Bulk submission:', bulkData);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };

  const handleExport = () => {
    if (syncQueue.length === 0) {
      alert("No data pending export.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(syncQueue, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `mfl_export_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'search':
        return <FacilitySearchCard onSelectFacility={handleSelectFacility} pendingFacilities={syncQueue} />;
      case 'dataEntry':
        return (
          <QuickDataEntryForm
            facility={selectedFacility}
            initialData={draftData}
            onDataChange={handleDraftUpdate}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setActiveView('search');
              setSelectedFacility(null);
              setDraftData({});
            }}
          />
        );
      case 'gps':
        return <GPSCaptureCard onCapture={handleGPSCapture} initialCoordinates={gpsData} />;
      case 'photos':
        return <PhotoCaptureCard onPhotosCapture={handlePhotosCapture} gpsData={gpsData} />;
      case 'voice':
        return <VoiceInputCard onTranscript={handleVoiceTranscript} />;
      case 'bulk':
        return <BulkCollectionCard onBulkSubmit={handleBulkSubmit} />;
      case 'quality':
        return <QualityAssuranceCard formData={formData} photos={photos} gpsData={gpsData} />;
      default:
        return <FacilitySearchCard onSelectFacility={handleSelectFacility} />;
    }
  };

  const navigationItems = [
    { id: 'search', label: 'Search', icon: 'Search' },
    { id: 'dataEntry', label: 'Data Entry', icon: 'FileEdit' },
    { id: 'gps', label: 'GPS', icon: 'MapPin' },
    { id: 'photos', label: 'Photos', icon: 'Camera' },
    // { id: 'voice', label: 'Voice', icon: 'Mic' }, // Disabled for now
    // { id: 'bulk', label: 'Bulk', icon: 'Layers' }, // Disabled for now
    { id: 'quality', label: 'Quality', icon: 'ShieldCheck' }
  ];




  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileMenuButton />
        <WorkflowStatusIndicator />

        <main className="main-content">
          <div className="min-h-screen p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                    Mobile Field Collection
                  </h1>
                  <p className="text-muted-foreground">
                    Capture and update facility data with offline capabilities
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    iconName="Download"
                    iconPosition="left"
                    onClick={handleExport}
                  >
                    Export Data
                  </Button>


                  {activeView !== 'search' && (
                    <Button
                      variant="default"
                      iconName="Save"
                      iconPosition="left"
                      onClick={() => handleFormSubmit(draftData)} // Pass draft data directly
                      disabled={!draftData?.name} // Basic validation
                    >
                      Complete Submission
                    </Button>
                  )}

                  {activeView === 'search' && (
                    <Button
                      variant="default"
                      iconName="Upload"
                      iconPosition="left"
                      onClick={handleSync}
                      loading={isSyncing}
                      disabled={syncQueue.length === 0}
                    >
                      Sync All
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex overflow-x-auto scrollbar-thin gap-3 pb-2 -mx-1 px-1">
                    {navigationItems?.map((item) => (
                      <button
                        key={item?.id}
                        onClick={() => setActiveView(item?.id)}
                        className={`
                          relative group flex items-center gap-2.5 px-5 py-3 rounded-2xl whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out
                          border
                          ${activeView === item?.id
                            ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20 ring-offset-1 ring-offset-background z-10'
                            : 'bg-card border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-foreground/10 hover:shadow-md'
                          }
                        `}
                      >
                        <Icon
                          name={item?.icon}
                          size={18}
                          className={`transition-transform duration-300 ${activeView === item?.id ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}
                        />
                        <span>{item?.label}</span>
                      </button>
                    ))}
                  </div>

                  {renderActiveView()}
                </div>

                <div className="space-y-6">
                  <OfflineSyncStatus
                    pendingCount={syncQueue.length}
                    onSync={handleSync}
                    isSyncing={isSyncing}
                    lastSyncTime={lastSyncTime}
                  />

                  <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="Activity" size={20} className="text-primary" />
                      <h3 className="font-semibold text-foreground">Quick Stats</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="FileText" size={16} className="text-muted-foreground" />
                          <span className="text-sm text-foreground">Forms Completed</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">0</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="Camera" size={16} className="text-muted-foreground" />
                          <span className="text-sm text-foreground">Photos Captured</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">0</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="MapPin" size={16} className="text-muted-foreground" />
                          <span className="text-sm text-foreground">GPS Points</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">0</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="Clock" size={16} className="text-muted-foreground" />
                          <span className="text-sm text-foreground">Pending Sync</span>
                        </div>
                        <span className={`text-sm font-semibold ${syncQueue.length > 0 ? 'text-warning' : 'text-foreground'}`}>
                          {syncQueue.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="TrendingUp" size={20} className="text-primary" />
                      <h3 className="font-semibold text-foreground">Recent Activity</h3>
                    </div>

                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No recent activity
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {showSuccessModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card rounded-lg border border-border shadow-card-lg p-6 max-w-sm w-full text-center animate-slide-in">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={32} className="text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Success!</h3>
              <p className="text-sm text-muted-foreground">
                Your data has been saved and will be synced when online.
              </p>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};

export default MobileFieldCollectionApp;