import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const CascadeLocationFilter = ({ selectedLocation, onLocationChange }) => {
  // Mock PNG administrative divisions
  const regions = [
    { id: 'highlands', name: 'Highlands' },
    { id: 'southern', name: 'Southern' },
    { id: 'momase', name: 'Momase' },
    { id: 'ngislands', name: 'New Guinea Islands' }
  ];

  const provinces = {
    highlands: [
      { id: 'whp', name: 'Western Highlands' },
      { id: 'shp', name: 'Southern Highlands' },
      { id: 'ehp', name: 'Eastern Highlands' },
      { id: 'enga', name: 'Enga' }
    ],
    southern: [
      { id: 'ncd', name: 'National Capital District' },
      { id: 'central', name: 'Central' },
      { id: 'gulf', name: 'Gulf' },
      { id: 'western', name: 'Western' }
    ],
    momase: [
      { id: 'morobe', name: 'Morobe' },
      { id: 'madang', name: 'Madang' },
      { id: 'esp', name: 'East Sepik' },
      { id: 'sandaun', name: 'Sandaun' }
    ],
    ngislands: [
      { id: 'enb', name: 'East New Britain' },
      { id: 'wnb', name: 'West New Britain' },
      { id: 'manus', name: 'Manus' },
      { id: 'ni', name: 'New Ireland' }
    ]
  };

  const districts = {
    whp: [
      { id: 'mthagen', name: 'Mt Hagen' },
      { id: 'tambul', name: 'Tambul-Nebilyer' },
      { id: 'dei', name: 'Dei' }
    ],
    shp: [
      { id: 'wabag', name: 'Wabag' },
      { id: 'mendi', name: 'Mendi-Munihu' },
      { id: 'nipa', name: 'Nipa-Kutubu' }
    ],
    ncd: [
      { id: 'pom', name: 'Port Moresby' }
    ]
  };

  const facilities = {
    mthagen: [
      { id: 'mth-gen', name: 'Mt Hagen General Hospital' },
      { id: 'mth-hc', name: 'Mt Hagen Health Centre' }
    ],
    wabag: [
      { id: 'wbg-nur', name: 'Wabag Health Centre' },
      { id: 'wbg-aid', name: 'Wabag Aid Post' }
    ],
    pom: [
      { id: 'pom-gen', name: 'Port Moresby General Hospital' },
      { id: 'pom-six', name: 'Six Mile Health Centre' }
    ]
  };

  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableFacilities, setAvailableFacilities] = useState([]);

  useEffect(() => {
    if (selectedLocation?.region) {
      setAvailableProvinces(provinces?.[selectedLocation?.region] || []);
    } else {
      setAvailableProvinces([]);
    }
  }, [selectedLocation?.region]);

  useEffect(() => {
    if (selectedLocation?.province) {
      setAvailableDistricts(districts?.[selectedLocation?.province] || []);
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedLocation?.province]);

  useEffect(() => {
    if (selectedLocation?.district) {
      setAvailableFacilities(facilities?.[selectedLocation?.district] || []);
    } else {
      setAvailableFacilities([]);
    }
  }, [selectedLocation?.district]);

  const handleRegionChange = (regionId) => {
    onLocationChange?.({
      region: regionId,
      province: null,
      district: null,
      facility: null
    });
  };

  const handleProvinceChange = (provinceId) => {
    onLocationChange?.({
      ...selectedLocation,
      province: provinceId,
      district: null,
      facility: null
    });
  };

  const handleDistrictChange = (districtId) => {
    onLocationChange?.({
      ...selectedLocation,
      district: districtId,
      facility: null
    });
  };

  const handleFacilityChange = (facilityId) => {
    onLocationChange?.({
      ...selectedLocation,
      facility: facilityId
    });
  };

  const handleClearFilters = () => {
    onLocationChange?.({
      region: null,
      province: null,
      district: null,
      facility: null
    });
  };

  return (
    <div className="bg-muted/30 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="MapPin" size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Location Filters</h3>
        {(selectedLocation?.region || selectedLocation?.province || selectedLocation?.district || selectedLocation?.facility) && (
          <button
            onClick={handleClearFilters}
            className="ml-auto text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Region
          </label>
          <Select
            value={selectedLocation?.region || ''}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full"
          >
            <option value="">All Regions</option>
            {regions?.map(region => (
              <option key={region?.id} value={region?.id}>
                {region?.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Province
          </label>
          <Select
            value={selectedLocation?.province || ''}
            onChange={(e) => handleProvinceChange(e.target.value)}
            disabled={!selectedLocation?.region}
            className="w-full"
          >
            <option value="">All Provinces</option>
            {availableProvinces?.map(province => (
              <option key={province?.id} value={province?.id}>
                {province?.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            District
          </label>
          <Select
            value={selectedLocation?.district || ''}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={!selectedLocation?.province}
            className="w-full"
          >
            <option value="">All Districts</option>
            {availableDistricts?.map(district => (
              <option key={district?.id} value={district?.id}>
                {district?.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Facility
          </label>
          <Select
            value={selectedLocation?.facility || ''}
            onChange={(e) => handleFacilityChange(e.target.value)}
            disabled={!selectedLocation?.district}
            className="w-full"
          >
            <option value="">All Facilities</option>
            {availableFacilities?.map(facility => (
              <option key={facility?.id} value={facility?.id}>
                {facility?.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Active Filter Summary */}
      {(selectedLocation?.region || selectedLocation?.province || selectedLocation?.district || selectedLocation?.facility) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {selectedLocation?.region && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {regions?.find(r => r?.id === selectedLocation?.region)?.name}
            </span>
          )}
          {selectedLocation?.province && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {availableProvinces?.find(p => p?.id === selectedLocation?.province)?.name}
            </span>
          )}
          {selectedLocation?.district && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {availableDistricts?.find(d => d?.id === selectedLocation?.district)?.name}
            </span>
          )}
          {selectedLocation?.facility && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {availableFacilities?.find(f => f?.id === selectedLocation?.facility)?.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CascadeLocationFilter;