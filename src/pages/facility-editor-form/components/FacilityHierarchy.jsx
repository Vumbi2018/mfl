import React from 'react';
import Icon from '../../../components/AppIcon';

const FacilityHierarchy = ({ facility, locationData = [] }) => {

  // Helper to find names from IDs
  const getProvinceName = () => {
    // Prioritize ID lookup as it reflects current form state
    if (facility?.province_id && locationData?.length > 0) {
      for (const item of locationData) {
        if (item.provinces) {
          const province = item.provinces.find(p => p.id == facility.province_id);
          if (province) return province.name;
        } else if ((item.districts || item.province_id) && item.id == facility.province_id) {
          return item.name;
        }
      }
    }
    // Fallback to static name
    if (facility?.province) return facility.province;

    return '-';
  };

  const getDistrictName = () => {
    // Prioritize ID lookup
    if (facility?.district_id && locationData?.length > 0) {
      for (const item of locationData) {
        if (item.provinces) {
          for (const province of item.provinces) {
            const district = province.districts?.find(d => d.id == facility.district_id);
            if (district) return district.name;
          }
        } else if (item.districts) {
          const district = item.districts.find(d => d.id == facility.district_id);
          if (district) return district.name;
        }
      }
    }
    // Fallback
    if (facility?.district) return facility.district;

    return '-';
  };

  const hierarchyLevels = [
    {
      level: 'National',
      name: 'Ministry of Health',
      icon: 'Building2',
      status: 'active'
    },
    {
      level: 'Province',
      name: getProvinceName(),
      icon: 'MapPin',
      status: 'active'
    },
    {
      level: 'District',
      name: getDistrictName(),
      icon: 'Map',
      status: 'active'
    },
    {
      level: 'Facility',
      name: facility?.name || 'Current Facility',
      icon: 'Hospital',
      status: 'current'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="GitBranch" size={16} />
        Facility Hierarchy
      </h3>
      <div className="space-y-3">
        {hierarchyLevels?.map((level, index) => (
          <div key={index} className="relative">
            {index < hierarchyLevels?.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-6 bg-border" />
            )}
            <div className={`flex items-center gap-3 p-2 rounded-md transition-colors ${level?.status === 'current' ? 'bg-primary/10' : 'hover:bg-muted'
              }`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-md ${level?.status === 'current' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                <Icon name={level?.icon} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{level?.level}</p>
                <p className="text-sm font-medium text-foreground truncate">{level?.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacilityHierarchy;