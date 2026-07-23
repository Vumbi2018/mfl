import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import api from '../../../utils/api';

const FacilitySearchCard = ({ onSelectFacility, pendingFacilities = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [facilities, setFacilities] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, facilitiesRes] = await Promise.all([
          api.get('/facilities/types'),
          api.get('/facilities') // Default fetch
        ]);

        setFacilityTypes([
          { value: 'all', label: 'All Types' },
          ...typesRes.data.map(t => ({ value: t, label: t }))
        ]);

        setFacilities(facilitiesRes.data.data || []);
      } catch (err) {
        console.error("Error fetching search data:", err);
      }
    };
    fetchData();

    // Try to get user location for "Nearby" context
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Location access denied/unavailable", err)
      );
    }
  }, []);

  // Clear results on unmount if needed, or when selecting
  useEffect(() => {
    // Intentional no-op or specific clear logic if requested
    return () => {
      setFacilities([]);
    }
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterType !== 'all') params.append('type', filterType);

      // If we had a backend 'nearby' endpoint, we'd pass userLocation here.
      // For now, we search standard facilities.

      const response = await api.get(`/facilities?${params.toString()}`);
      let fetched = response.data.data || [];

      // Merge pending facilities from props
      // Filter out pending ones that might be duplicates or just append?
      // For simplicity, prepend pending items that match the search
      if (pendingFacilities && pendingFacilities.length > 0) {
        const pendingMatches = pendingFacilities
          .filter(item => item.type === 'facility_update')
          .map(item => ({
            id: `pending-${item.id}`,
            name: item.payload.common_name || 'Draft Facility',
            common_name: item.payload.common_name || 'Draft Facility',
            operational_status: 'Pending Sync',
            type: item.payload.facility_type,
            district: 'Local Draft',
            province: 'Local Draft',
            isPending: true,
            originalPayload: item.payload // Store payload for re-hydration if needed
          }))
          .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()));

        fetched = [...pendingMatches, ...fetched];
      }

      setFacilities(fetched);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (facility) => {
    if (!userLocation || !facility.latitude || !facility.longitude) return null;
    // Basic Haversine or simple distance placeholder could go here
    // For now, returning null to avoid misleading data if math isn't rigorous
    return null;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'operational':
        return 'text-success bg-success/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'closed':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Search" size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Search Facilities</h2>
        </div>

        <div className="space-y-3">
          <Input
            type="search"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              options={facilityTypes}
              value={filterType}
              onChange={setFilterType}
              placeholder="Filter by type"
            />

            <Button
              variant="default"
              iconName="Search"
              iconPosition="left"
              onClick={handleSearch}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Searching...' : 'Find Facilities'}
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
        {facilities.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="SearchX" size={48} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No facilities found</p>
          </div>
        ) : (
          facilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors cursor-pointer group"
              onClick={() => onSelectFacility(facility)}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-md bg-white border border-border flex items-center justify-center flex-shrink-0 text-primary/40 group-hover:text-primary group-hover:border-primary/50 transition-colors">
                  <Icon name="Building2" size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">{facility.name || facility.common_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap capitalize ${getStatusColor(facility.operational_status)}`}>
                      {facility.operational_status || 'Unknown'}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                    {[facility.district, facility.province].filter(Boolean).join(', ')}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Icon name="MapPin" size={12} />
                      <span>{facility.region || 'Unknown Region'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Activity" size={12} />
                      <span>{facility.type || facility.facility_type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FacilitySearchCard;