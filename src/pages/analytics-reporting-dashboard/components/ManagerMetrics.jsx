import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Icon from '../../../components/AppIcon';

const ManagerMetrics = ({ facilities = [] }) => {
    // Calculate all metrics from the facilities data
    const metrics = useMemo(() => {
        if (!facilities.length) return null;

        // Facility Type Distribution
        const typeGroups = {};
        const ownershipGroups = {};
        let totalBeds = 0;
        let facilitiesWithBeds = 0;
        let recentlyUpdated = 0;
        let totalStaff = 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        facilities.forEach(f => {
            // Type grouping
            const type = f.type || f.facility_type || 'Unknown';
            typeGroups[type] = (typeGroups[type] || 0) + 1;

            // Ownership grouping
            const ownership = f.ownership || 'Unknown';
            ownershipGroups[ownership] = (ownershipGroups[ownership] || 0) + 1;

            // Beds
            const beds = parseInt(f.total_beds) || 0;
            if (beds > 0) {
                totalBeds += beds;
                facilitiesWithBeds++;
            }

            // Staff
            const staff = parseInt(f.staff_count) || parseInt(f.total_staff) || 0;
            totalStaff += staff;

            // Data freshness
            const updatedAt = f.updated_at ? new Date(f.updated_at) : null;
            if (updatedAt && updatedAt > thirtyDaysAgo) {
                recentlyUpdated++;
            }
        });

        // Convert to chart data
        const typeData = Object.entries(typeGroups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6 types

        const ownershipData = Object.entries(ownershipGroups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const freshnessRate = Math.round((recentlyUpdated / facilities.length) * 100);

        return {
            total: facilities.length,
            typeData,
            ownershipData,
            totalBeds,
            facilitiesWithBeds,
            avgBedsPerFacility: facilitiesWithBeds > 0 ? Math.round(totalBeds / facilitiesWithBeds) : 0,
            totalStaff,
            recentlyUpdated,
            freshnessRate
        };
    }, [facilities]);

    if (!metrics) {
        return (
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="text-center text-muted-foreground py-8">
                    <Icon name="BarChart3" size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No data available for metrics</p>
                </div>
            </div>
        );
    }

    const TYPE_COLORS = [
        '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316'
    ];

    const OWNERSHIP_COLORS = {
        'Government': '#10B981',
        'Private': '#3B82F6',
        'NGO': '#8B5CF6',
        'Faith-Based': '#F59E0B',
        'Unknown': '#94A3B8'
    };

    const getOwnershipColor = (name) => OWNERSHIP_COLORS[name] || TYPE_COLORS[Object.keys(OWNERSHIP_COLORS).length % TYPE_COLORS.length];

    return (
        <div className="space-y-6">
            {/* Summary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Icon name="Bed" size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{metrics.totalBeds.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Bed Capacity</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Icon name="Users" size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{metrics.totalStaff.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Staff</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Icon name="Calculator" size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{metrics.avgBedsPerFacility}</p>
                            <p className="text-xs text-muted-foreground">Avg Beds/Facility</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metrics.freshnessRate >= 70 ? 'bg-emerald-500/10' : metrics.freshnessRate >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                            <Icon name="RefreshCw" size={20} className={metrics.freshnessRate >= 70 ? 'text-emerald-600' : metrics.freshnessRate >= 40 ? 'text-amber-600' : 'text-red-600'} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{metrics.freshnessRate}%</p>
                            <p className="text-xs text-muted-foreground">Updated (30d)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facility Type Distribution */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Icon name="Building2" size={16} className="text-primary" />
                        Facility Type Distribution
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.typeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name.substring(0, 12)}${name.length > 12 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {metrics.typeData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={TYPE_COLORS[idx % TYPE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={{
                                        backgroundColor: 'var(--color-card)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {metrics.typeData.map((item, idx) => (
                            <div key={item.name} className="flex items-center gap-1.5 text-xs">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[idx % TYPE_COLORS.length] }} />
                                <span className="text-muted-foreground">{item.name}</span>
                                <span className="font-medium text-foreground">({item.value})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ownership Breakdown */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Icon name="Users2" size={16} className="text-primary" />
                        Ownership Breakdown
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.ownershipData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {metrics.ownershipData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={getOwnershipColor(entry.name)} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={{
                                        backgroundColor: 'var(--color-card)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4 justify-center">
                        {metrics.ownershipData.map((item, idx) => (
                            <div key={item.name} className="flex items-center gap-1.5 text-xs">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getOwnershipColor(item.name) }} />
                                <span className="text-muted-foreground">{item.name}</span>
                                <span className="font-medium text-foreground">({item.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerMetrics;
