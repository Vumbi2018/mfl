import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import api from '../../../utils/api';

const FilterSidebar = ({ onFilterChange, isCollapsed, onToggleCollapse }) => {
  // Filters state matching MapCanvas expectations (snake_case for IDs)
  const [filters, setFilters] = useState({
    region_id: 'all',
    province_id: 'all',
    district_id: 'all',
    ward_id: 'all',
    type: 'all',
    status: 'all',
    services: [],
    only_gps: false,
    only_photos: false,
    only_non_functional: false
  });

  const [locationData, setLocationData] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    pending: 0,
    escalated: 0,
    rejected: 0
  });

  // Fetch Location Data & Counts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const locResponse = await api.get('/facilities/locations');
        setLocationData(locResponse.data);

        // Optional: Fetch real status counts if needed
        // const countResponse = await api.get('/analytics/status-counts'); 
        // setStatusCounts(countResponse.data);
      } catch (err) {
        console.error("Error fetching filter data:", err);
      }
    };
    fetchData();
  }, []);

  // Compute Options based on Hierarchy
  const hasRegions = locationData.length > 0 && !!locationData[0].provinces;

  const regionOptions = [
    { value: 'all', label: 'All Regions' },
    ...locationData.map(r => ({ value: r.id, label: r.name }))
  ];

  const provinces = hasRegions 
    ? (filters.region_id !== 'all' ? locationData.find(r => r.id == filters.region_id)?.provinces || [] : [])
    : locationData;

  const provinceOptions = [
    { value: 'all', label: 'All Provinces' },
    ...(provinces.map(p => ({ value: p.id, label: p.name })) || [])
  ];

  const selectedProvince = provinces.find(p => p.id == filters.province_id);
  const districtOptions = [
    { value: 'all', label: 'All Districts' },
    ...(selectedProvince?.districts?.map(d => ({ value: d.id, label: d.name })) || [])
  ];

  const selectedDistrict = selectedProvince?.districts?.find(d => d.id == filters.district_id);
  const wardOptions = [
    { value: 'all', label: 'All Wards' },
    ...(selectedDistrict?.wards?.map(w => ({ value: w.id, label: w.name })) || [])
  ];

  const [facilityTypeOptions, setFacilityTypeOptions] = useState([
    { value: 'all', label: 'All Types' }
  ]);

  // Fetch Facility Types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await api.get('/facilities/types');
        const types = response.data.map(type => ({ value: type, label: type }));
        setFacilityTypeOptions([{ value: 'all', label: 'All Types' }, ...types]);
      } catch (err) {
        console.error("Error fetching facility types:", err);
      }
    };
    fetchTypes();
  }, []);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'operational', label: 'Operational / Open' },
    { value: 'closed', label: 'Closed / Inactive' },
    { value: 'pending', label: 'Pending / Unknown' }
  ];

  const servicesList = [
    'Emergency', 'Surgery', 'ICU', 'Maternity', 'OPD',
    'Vaccination', 'Pharmacy', 'Diagnostics'
  ];

  const handleFilterUpdate = (key, value) => {
    let newFilters = { ...filters, [key]: value };

    // Cascading Resets
    if (key === 'region_id') {
      newFilters.province_id = 'all';
      newFilters.district_id = 'all';
      newFilters.ward_id = 'all';
    }
    if (key === 'province_id') {
      newFilters.district_id = 'all';
      newFilters.ward_id = 'all';
    }
    if (key === 'district_id') {
      newFilters.ward_id = 'all';
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleServiceToggle = (service) => {
    const newServices = filters?.services?.includes(service)
      ? filters?.services?.filter(s => s !== service)
      : [...filters?.services, service];
    handleFilterUpdate('services', newServices);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      region_id: 'all',
      province_id: 'all',
      district_id: 'all',
      ward_id: 'all',
      type: 'all',
      status: 'all',
      services: [],
      only_gps: false,
      only_photos: false,
      only_non_functional: false
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  if (isCollapsed) {
    return (
      <div className="w-20 bg-card border-r border-border h-full flex flex-col items-center py-4 gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Expand Filters"
        >
          <Icon name="ChevronRight" size={20} />
        </button>
        <div className="flex flex-col gap-3">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Filter" size={20} className="text-primary" />
          <h2 className="font-semibold text-foreground">Filters</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearFilters}
            className="text-xs text-primary font-bold hover:underline px-2 py-1 rounded hover:bg-primary/10 transition-all flex items-center gap-1"
            title="Reset All Filters"
          >
            <Icon name="RotateCcw" size={12} />
            Reset
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title="Collapse Filters"
          >
            <Icon name="ChevronLeft" size={18} />
          </button>
        </div>
      </div>

      {/* Filters Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
        {/* Administrative Boundaries */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Location</h3>
          <div className="space-y-3">
            {hasRegions && (
              <Select
                label="Region"
                options={regionOptions}
                value={filters.region_id}
                onChange={(value) => handleFilterUpdate('region_id', value)}
              />
            )}
            <Select
              label="Province"
              options={provinceOptions}
              value={filters.province_id}
              onChange={(value) => handleFilterUpdate('province_id', value)}
              disabled={hasRegions && filters.region_id === 'all'}
            />
            <Select
              label="District"
              options={districtOptions}
              value={filters.district_id}
              onChange={(value) => handleFilterUpdate('district_id', value)}
              disabled={filters.province_id === 'all'}
            />
            <Select
              label="Ward"
              options={wardOptions}
              value={filters.ward_id}
              onChange={(value) => handleFilterUpdate('ward_id', value)}
              disabled={filters.district_id === 'all'}
            />
          </div>
        </div>


        {/* Facility Type */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Facility Type</h3>
          <Select
            options={facilityTypeOptions}
            value={filters.type}
            onChange={(value) => handleFilterUpdate('type', value)}
          />
        </div>

        {/* Status */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Operational Status</h3>
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(value) => handleFilterUpdate('status', value)}
          />
        </div>

        {/* Services */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Services Available</h3>
          <div className="space-y-2">
            {servicesList?.map(service => (
              <Checkbox
                key={service}
                label={service}
                checked={filters?.services?.includes(service)}
                onChange={() => handleServiceToggle(service)}
              />
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Filters</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleFilterUpdate('only_gps', !filters.only_gps)}
              className={`w-full px-3 py-2 text-sm text-left rounded-md transition-colors flex items-center justify-between group ${filters.only_gps ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="MapPin" size={16} />
                <span>Facilities with GPS</span>
              </div>
              {filters.only_gps && <Icon name="Check" size={14} />}
            </button>

            <button
              onClick={() => handleFilterUpdate('only_photos', !filters.only_photos)}
              className={`w-full px-3 py-2 text-sm text-left rounded-md transition-colors flex items-center justify-between group ${filters.only_photos ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="Image" size={16} />
                <span>With Photos</span>
              </div>
              {filters.only_photos && <Icon name="Check" size={14} />}
            </button>

            <button
              onClick={() => handleFilterUpdate('only_non_functional', !filters.only_non_functional)}
              className={`w-full px-3 py-2 text-sm text-left rounded-md transition-colors flex items-center justify-between group ${filters.only_non_functional ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} />
                <span>Is Not Functional</span>
              </div>
              {filters.only_non_functional && <Icon name="Check" size={14} />}
            </button>
          </div>
        </div>
      </div>
      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={handleClearFilters}
          className="w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;