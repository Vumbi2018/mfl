import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const PerformanceComparison = ({ data, rawFacilities = [], viewLevel, onViewLevelChange }) => {
  const navigate = useNavigate();
  // Drilldown state: [{ level: 'region', value: 'Highlands' }, { level: 'province', value: 'Western Highlands' }]
  const [drillPath, setDrillPath] = useState([]);

  const viewLevels = [
    { value: 'national', label: 'National', icon: 'Globe' },
    { value: 'province', label: 'Province', icon: 'MapPin' },
    { value: 'district', label: 'District', icon: 'Map' }
  ];

  // Calculate chart data based on current drill level
  const chartData = useMemo(() => {
    if (!rawFacilities || rawFacilities.length === 0) {
      return data || []; // Fallback to props data
    }

    let filteredData = rawFacilities;
    let groupByField = 'region';

    // Apply drill filters
    if (drillPath.length === 1) {
      // Drilled into a Region -> Show Provinces
      groupByField = 'province';
      filteredData = rawFacilities.filter(f => f.region === drillPath[0].value);
    } else if (drillPath.length === 2) {
      // Drilled into a Province -> Show Districts
      groupByField = 'district';
      filteredData = rawFacilities.filter(f => f.province === drillPath[1].value);
    } else if (drillPath.length >= 3) {
      // At district level - navigate to facilities
      return [];
    }

    // Aggregate by group
    const groups = {};
    filteredData.forEach(f => {
      const key = f[groupByField] || 'Unknown';
      if (!groups[key]) {
        groups[key] = { jurisdiction: key, approved: 0, pending: 0, rejected: 0, total: 0 };
      }

      const status = (f.workflow_status || f.operational_status || 'PENDING').toUpperCase();
      if (status.includes('APPROVE') || status.includes('OPERATIONAL') || status.includes('ACTIVE')) {
        groups[key].approved++;
      } else if (status.includes('REJECT') || status.includes('CLOSE')) {
        groups[key].rejected++;
      } else {
        groups[key].pending++;
      }
      groups[key].total++;
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [rawFacilities, drillPath, data]);

  // Handle bar click for drilldown
  const handleBarClick = (barData) => {
    if (!barData || !barData.activeLabel) return;

    const selection = barData.activeLabel;

    if (drillPath.length === 0) {
      // National -> Region (drill into region)
      setDrillPath([{ level: 'region', value: selection }]);
    } else if (drillPath.length === 1) {
      // Region -> Province (drill into province)
      setDrillPath([...drillPath, { level: 'province', value: selection }]);
    } else if (drillPath.length === 2) {
      // Province -> District (navigate to facility list)
      navigate(`/facilities?district=${encodeURIComponent(selection)}`);
    }
  };

  const handleBack = () => {
    setDrillPath(prev => prev.slice(0, -1));
  };

  const handleReset = () => {
    setDrillPath([]);
  };

  const getCurrentTitle = () => {
    if (drillPath.length === 0) return 'Region Overview';
    if (drillPath.length === 1) return `Provinces in ${drillPath[0].value}`;
    if (drillPath.length === 2) return `Districts in ${drillPath[1].value}`;
    return 'Facility Level';
  };

  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'National', level: -1 }];
    drillPath.forEach((p, idx) => {
      crumbs.push({ label: p.value, level: idx });
    });
    return crumbs;
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Cross-Jurisdictional Performance</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {getCurrentTitle()} • Click bars to drill down
          </p>
        </div>
        <div className="flex items-center gap-2">
          {drillPath.length > 0 && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm border px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
              >
                <Icon name="ArrowLeft" size={14} />
                Back
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-sm border px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
              >
                <Icon name="Home" size={14} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {drillPath.length > 0 && (
        <div className="flex items-center gap-1 text-xs mb-4 pb-3 border-b border-border">
          {getBreadcrumbs().map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <Icon name="ChevronRight" size={12} className="text-muted-foreground" />}
              <button
                onClick={() => {
                  if (crumb.level === -1) handleReset();
                  else setDrillPath(drillPath.slice(0, crumb.level + 1));
                }}
                className={`px-2 py-1 rounded transition-colors ${idx === getBreadcrumbs().length - 1
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-muted-foreground'
                  }`}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {(!chartData || chartData.length === 0) ? (
        <div className="w-full h-80 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
          <div className="text-center text-muted-foreground">
            <Icon name="BarChart2" size={32} className="mx-auto mb-2 opacity-50" />
            <p>No performance data available</p>
            {drillPath.length > 0 && (
              <button onClick={handleReset} className="text-primary text-sm mt-2 hover:underline">
                Reset to national view
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-80" aria-label="Cross-Jurisdictional Performance Bar Chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onClick={handleBarClick}
              style={{ cursor: drillPath.length < 2 ? 'pointer' : 'default' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="jurisdiction"
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
                interval={0}
                angle={chartData.length > 5 ? -30 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 60 : 30}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
                label={{ value: 'Facilities', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px'
                }}
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Bar dataKey="approved" fill="#10B981" name="Approved" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="#EF4444" name="Rejected" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-success mb-1">
            {chartData?.reduce((sum, item) => sum + (item?.approved || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Approved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning mb-1">
            {chartData?.reduce((sum, item) => sum + (item?.pending || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-error mb-1">
            {chartData?.reduce((sum, item) => sum + (item?.rejected || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Rejected</div>
        </div>
      </div>

      {/* Drill hint */}
      {drillPath.length < 2 && chartData.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Icon name="MousePointer" size={12} />
            Click on any bar to drill down to {drillPath.length === 0 ? 'provinces' : 'districts'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceComparison;