import React from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const FilterPanel = ({ filters, onFilterChange, onClearFilters, locations = [], facilityTypeOptions = [] }) => {

  const hasRegions = locations?.length > 0 && !!locations[0].provinces;

  const regionOptions = hasRegions ? locations.map(r => ({ value: r.name, label: r.name })) : [];
  const selectedRegion = hasRegions ? locations.find(r => r.name === filters.region) : null;
  
  const provinceOptions = hasRegions 
    ? (selectedRegion?.provinces?.map(p => ({ value: p.name, label: p.name })) || [])
    : locations.map(p => ({ value: p.name, label: p.name }));

  const selectedProvince = hasRegions 
    ? selectedRegion?.provinces?.find(p => p.name === filters.province)
    : locations.find(p => p.name === filters.province);

  const selectedDistrict = selectedProvince?.districts?.find(d => d.name === filters.district);
  const wardOptions = selectedDistrict?.wards?.map(w => ({ value: w.name, label: w.name })) || [];

  const defaultFacilityTypeOptions = [
    { value: 'all', label: 'All Facility Types' },
    ...facilityTypeOptions
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'in-review', label: 'In Review' },
    { value: 'escalated', label: 'Escalated' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const submissionAgeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const hasActiveFilters = Object.values(filters)?.some(value => value !== 'all' && value !== '');

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Icon name="Filter" size={16} />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Icon name="X" size={12} />
            Clear All
          </button>
        )}
      </div>
      <div className="space-y-3">
        <Input
          type="search"
          placeholder="Search by facility name..."
          value={filters?.search || ''}
          onChange={(e) => onFilterChange('search', e?.target?.value)}
          className="w-full"
        />

        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</h3>
          {hasRegions && (
            <Select
              label="Region"
              options={[{ value: 'all', label: 'All Regions' }, ...regionOptions]}
              value={filters?.region || 'all'}
              onChange={(value) => onFilterChange('region', value)}
            />
          )}
          <Select
            label="Province"
            options={[{ value: 'all', label: 'All Provinces' }, ...provinceOptions]}
            value={filters?.province || 'all'}
            onChange={(value) => onFilterChange('province', value)}
            disabled={hasRegions && (!filters?.region || filters?.region === 'all')}
          />
          <Select
            label="District"
            options={[{ value: 'all', label: 'All Districts' }, ...districtOptions]}
            value={filters?.district || 'all'}
            onChange={(value) => onFilterChange('district', value)}
            disabled={!filters?.province || filters?.province === 'all'}
          />
          <Select
            label="Ward"
            options={[{ value: 'all', label: 'All Wards' }, ...wardOptions]}
            value={filters?.ward || 'all'}
            onChange={(value) => onFilterChange('ward', value)}
            disabled={!filters?.district || filters?.district === 'all'}
          />
        </div>


        <Select
          label="Facility Type"
          options={defaultFacilityTypeOptions}
          value={filters?.facilityType || 'all'}
          onChange={(value) => onFilterChange('facilityType', value)}
        />

        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status || 'all'}
          onChange={(value) => onFilterChange('status', value)}
        />

        <Select
          label="Priority"
          options={priorityOptions}
          value={filters?.priority || 'all'}
          onChange={(value) => onFilterChange('priority', value)}
        />

        <Select
          label="Submission Age"
          options={submissionAgeOptions}
          value={filters?.submissionAge || 'all'}
          onChange={(value) => onFilterChange('submissionAge', value)}
        />
      </div>
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Active Filters:</span>
          <span className="font-medium">{hasActiveFilters ? Object.values(filters)?.filter(v => v !== 'all' && v !== '')?.length : 0}</span>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;