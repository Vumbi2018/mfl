import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const CoverageHeatMap = ({ data, selectedRegion, onRegionSelect }) => {
  const navigate = useNavigate();

  const getIntensityColor = (value) => {
    if (value >= 80) return 'bg-success/20 border-success hover:bg-success/30';
    if (value >= 60) return 'bg-warning/20 border-warning hover:bg-warning/30';
    return 'bg-error/20 border-error hover:bg-error/30';
  };

  const getTextColor = (value) => {
    if (value >= 80) return 'text-success';
    if (value >= 60) return 'text-warning';
    return 'text-error';
  };

  const handleProvinceClick = (region) => {
    // Set selected region for visual feedback
    onRegionSelect(region?.id);
    // Navigate to facilities list filtered by this province
    navigate(`/facilities?province=${encodeURIComponent(region?.name)}`);
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">GPS Data Completeness by Province</h3>
          <p className="text-sm text-muted-foreground mt-1">Click on a province to view its facilities</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
          <Icon name="Download" size={16} />
          Export Map
        </button>
      </div>

      {/* Responsive Grid: 1 col on mobile, 2 on sm, 3 on md, 4 on lg, 5 on xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
        {data?.map((region) => (
          <button
            key={region?.id}
            onClick={() => handleProvinceClick(region)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
              ${getIntensityColor(region?.coverage)}
              ${selectedRegion === region?.id ? 'ring-2 ring-primary ring-offset-2' : ''}
              hover:scale-[1.02] hover:shadow-md active:scale-[0.98]
              flex flex-col items-center text-center
            `}
          >
            <div className={`text-3xl font-bold mb-1 ${getTextColor(region?.coverage)}`}>
              {region?.coverage}%
            </div>
            <div className="text-sm font-medium text-foreground line-clamp-2">
              {region?.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Icon name="Building2" size={12} />
              {region?.facilities} facilities
            </div>
            <div className="mt-2 text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon name="ExternalLink" size={10} />
              View Facilities
            </div>
          </button>
        ))}
      </div>

      {/* Legend - also responsive */}
      <div className="flex flex-wrap items-center justify-between pt-4 border-t border-border gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-xs text-muted-foreground">High Coverage (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-xs text-muted-foreground">Medium Coverage (60-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <span className="text-xs text-muted-foreground">Low Coverage (&lt;60%)</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Click any card to drill down</span>
      </div>
    </div>
  );
};

export default CoverageHeatMap;