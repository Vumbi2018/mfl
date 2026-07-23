import React from 'react';
import Icon from '../../../components/AppIcon';

const FilterBar = ({
    filters,
    onFilterChange,
    provinces = [],
    districts = [],
    facilityTypes = [],
    onClearFilters
}) => {
    const hasActiveFilters = filters.province || filters.district || filters.facilityType;

    return (
        <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
                {/* Province Filter */}
                <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Province</label>
                    <select
                        value={filters.province || ''}
                        onChange={(e) => onFilterChange('province', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">All Provinces</option>
                        {provinces.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {/* District Filter */}
                <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">District</label>
                    <select
                        value={filters.district || ''}
                        onChange={(e) => onFilterChange('district', e.target.value)}
                        disabled={!filters.province}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">All Districts</option>
                        {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* Facility Type Filter */}
                <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Facility Type</label>
                    <select
                        value={filters.facilityType || ''}
                        onChange={(e) => onFilterChange('facilityType', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">All Types</option>
                        {facilityTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                    <button
                        onClick={onClearFilters}
                        disabled={!hasActiveFilters}
                        className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
              ${hasActiveFilters
                                ? 'bg-error/10 text-error hover:bg-error/20'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }
            `}
                    >
                        <Icon name="X" size={14} />
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Active:</span>
                    {filters.province && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                            <Icon name="MapPin" size={12} />
                            {filters.province}
                            <button onClick={() => onFilterChange('province', '')} className="hover:text-error">
                                <Icon name="X" size={10} />
                            </button>
                        </span>
                    )}
                    {filters.district && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 rounded-full">
                            <Icon name="Map" size={12} />
                            {filters.district}
                            <button onClick={() => onFilterChange('district', '')} className="hover:text-error">
                                <Icon name="X" size={10} />
                            </button>
                        </span>
                    )}
                    {filters.facilityType && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-600 rounded-full">
                            <Icon name="Building2" size={12} />
                            {filters.facilityType}
                            <button onClick={() => onFilterChange('facilityType', '')} className="hover:text-error">
                                <Icon name="X" size={10} />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilterBar;
