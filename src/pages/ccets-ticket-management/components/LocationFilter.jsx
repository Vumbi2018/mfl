import React from 'react';
import { MapPin } from 'lucide-react';

const LocationFilter = ({ pngRegions, locationFilter, setLocationFilter }) => {
  const handleLocationChange = (field, value) => {
    const newFilter = { ...locationFilter, [field]: value };
    
    // Reset dependent fields
    if (field === 'region') {
      newFilter.province = 'all';
      newFilter.district = 'all';
      newFilter.facility = 'all';
    }
    if (field === 'province') {
      newFilter.district = 'all';
      newFilter.facility = 'all';
    }
    
    setLocationFilter(newFilter);
  };

  const availableProvinces = locationFilter?.region !== 'all' ? 
    Object.entries(pngRegions?.[locationFilter?.region]?.provinces || {}) : [];

  const availableDistricts = locationFilter?.province !== 'all' && locationFilter?.region !== 'all' ? 
    pngRegions?.[locationFilter?.region]?.provinces?.[locationFilter?.province]?.districts || [] : [];

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center space-x-2 mb-3">
        <MapPin className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-700">Location Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Region */}
        <select
          value={locationFilter?.region}
          onChange={(e) => handleLocationChange('region', e?.target?.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Regions</option>
          {Object.entries(pngRegions)?.map(([key, region]) => (
            <option key={key} value={key}>{region?.name}</option>
          ))}
        </select>

        {/* Province */}
        <select
          value={locationFilter?.province}
          onChange={(e) => handleLocationChange('province', e?.target?.value)}
          disabled={locationFilter?.region === 'all'}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="all">All Provinces</option>
          {availableProvinces?.map(([key, province]) => (
            <option key={key} value={key}>{province?.name}</option>
          ))}
        </select>

        {/* District */}
        <select
          value={locationFilter?.district}
          onChange={(e) => handleLocationChange('district', e?.target?.value)}
          disabled={locationFilter?.province === 'all'}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="all">All Districts</option>
          {availableDistricts?.map((district) => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LocationFilter;