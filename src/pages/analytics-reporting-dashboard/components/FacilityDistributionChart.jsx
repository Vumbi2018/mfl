import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

// Drilldown Chart: Region -> Province -> District -> Facility Table
// Prop: data = flat array of facilities
// Prop: simple = boolean (if true, shows single color bars for total count)
const FacilityDistributionChart = ({ data = [], simple = false }) => {
    const navigate = useNavigate();
    // drillPath: array of currently selected filters, e.g. [{ level: 'region', value: 'Highlands' }, { level: 'province', value: 'Hela' }]
    const [drillPath, setDrillPath] = useState([]);

    // Helper: Aggregate data based on current drill level
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { items: [], types: [], rawList: [] };

        let levelToGroup = 'region';
        let filteredData = data;

        // Apply filters based on drill path
        if (drillPath.length === 1) {
            // Drilled into a Region -> Show Provinces
            levelToGroup = 'province';
            filteredData = data.filter(f => f.region === drillPath[0].value);
        } else if (drillPath.length === 2) {
            // Drilled into a Province -> Show Districts
            levelToGroup = 'district';
            filteredData = data.filter(f => f.province === drillPath[1].value);
        } else if (drillPath.length === 3) {
            // Drilled into a District -> Show Facilities (Table View)
            levelToGroup = 'name'; // Not used for grouping in table view, but for consistency
            filteredData = data.filter(f => f.district === drillPath[2].value);
        }

        // Grouping Logic (Only needed for Chart views, i.e. drillPath < 3)
        const groups = {};
        const allTypes = new Set();

        if (drillPath.length < 3) {
            filteredData.forEach(f => {
                const key = f[levelToGroup] || 'Unknown';
                if (!groups[key]) {
                    groups[key] = { name: key, total: 0 };
                }
                groups[key].total++;

                // Count Types for Stacked Bar
                const type = f.type || 'Other';
                allTypes.add(type);
                if (!groups[key][type]) groups[key][type] = 0;
                groups[key][type]++;
            });
        }

        return {
            items: Object.values(groups).sort((a, b) => b.total - a.total), // Sort desc by total count
            types: Array.from(allTypes),
            rawList: filteredData // Expose raw list for Table View
        };
    }, [data, drillPath]);

    const handleBarClick = (barData) => {
        if (!barData || !barData.activeLabel) return;

        const selection = barData.activeLabel;

        if (drillPath.length === 0) {
            // Region -> Province
            setDrillPath([{ level: 'region', value: selection }]);
        } else if (drillPath.length === 1) {
            // Province -> District
            setDrillPath([...drillPath, { level: 'province', value: selection }]);
        } else if (drillPath.length === 2) {
            // District -> Facility (Table View Trigger)
            setDrillPath([...drillPath, { level: 'district', value: selection }]);
        }
        // If length is 3 (Facility), we stop drilling
    };

    const handleBack = () => {
        setDrillPath(prev => prev.slice(0, -1));
    };

    // Consistent Colors for Types
    const TYPE_COLORS = {
        'Public Hospital': '#3B82F6', // Blue
        'Health Centre': '#10B981',   // Green
        'Aid Post': '#F59E0B',        // Amber
        'Urban Clinic': '#8B5CF6',    // Purple
        'Community Health Post': '#EC4899', // Pink
        'Other': '#94A3B8'            // Slate
    };
    const getColor = (type) => TYPE_COLORS[type] || '#' + Math.floor(Math.random() * 16777215).toString(16);

    const currentTitle = () => {
        if (drillPath.length === 0) return 'By Region';
        if (drillPath.length === 1) return `By Province (${drillPath[0].value})`;
        if (drillPath.length === 2) return `By District (${drillPath[1].value})`;
        return `Facilities in ${drillPath[2].value}`;
    };

    const isTableView = drillPath.length === 3;

    return (
        <div className="card-elevated p-6 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Facility Distribution</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {currentTitle()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {drillPath.length > 0 && (
                        <button onClick={handleBack} className="flex items-center gap-1 text-sm border px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-slate-700">
                            <Icon name="ArrowLeft" size={14} /> Back
                        </button>
                    )}
                </div>
            </div>

            {!data || data.length === 0 ? (
                <div className="w-full h-96 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
                    <div className="text-center text-muted-foreground">
                        <Icon name="BarChart2" size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No distribution data available</p>
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    {isTableView ? (
                        // Table View for Facilities Level
                        <div className="overflow-x-auto border rounded-lg border-slate-200 max-h-[500px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-slate-200">Name</th>
                                        <th className="px-4 py-3 border-b border-slate-200">Code</th>
                                        <th className="px-4 py-3 border-b border-slate-200">Type</th>
                                        <th className="px-4 py-3 border-b border-slate-200">Status</th>
                                        <th className="px-4 py-3 border-b border-slate-200">Ownership</th>
                                        <th className="px-4 py-3 border-b border-slate-200 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {chartData.rawList.map(f => (
                                        <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{f.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500 font-mono">{f.code}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    {f.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${(f.operational_status || '').toLowerCase().includes('open') || (f.operational_status || '').toLowerCase().includes('active')
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {f.operational_status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{f.ownership || '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => navigate(`/facilities/${f.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // Chart View for Aggregate Levels
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.items} onClick={handleBarClick} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        stroke="#64748B"
                                        fontSize={12}
                                        dy={10}
                                        interval={0}
                                        angle={drillPath.length > 1 ? -45 : 0}
                                        textAnchor={drillPath.length > 1 ? 'end' : 'middle'}
                                        height={60}
                                    />
                                    <YAxis axisLine={false} tickLine={false} stroke="#64748B" fontSize={12} />
                                    <Tooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                    {/* Conditional Rendering: Simple Total vs Stacked Types */}
                                    {simple ? (
                                        <Bar dataKey="total" fill="#3B82F6" name="Total Facilities" radius={[0, 4, 4, 0]} barSize={40} />
                                    ) : (
                                        (chartData.types || []).map(type => (
                                            <Bar key={type} dataKey={type} stackId="a" fill={getColor(type)} />
                                        ))
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4 text-xs text-center text-muted-foreground">
                {isTableView
                    ? `Showing ${chartData.rawList.length} facilities in ${drillPath[2]?.value}`
                    : drillPath.length < 3
                        ? "Click on a bar to drill down."
                        : "Viewing facility level data."}
            </div>
        </div>
    );
};

export default FacilityDistributionChart;
