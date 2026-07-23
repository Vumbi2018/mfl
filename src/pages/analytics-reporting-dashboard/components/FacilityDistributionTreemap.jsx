import React from 'react';
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const FacilityDistributionTreemap = ({ data }) => {
    // Custom Content Component for Treemap
    const CustomizedContent = (props) => {
        const { root, depth, x, y, width, height, index, payload, name, value, colors } = props;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: depth < 2 ? 'transparent' : '#3B82F6', // Only color leaves (Types)
                        opacity: 0.2 + (value / (root?.value || 100)) * 0.8, // Opacity based on size relative to total
                        stroke: '#fff',
                        strokeWidth: 2 / (depth + 1e-10),
                        strokeOpacity: 1 / (depth + 1e-10),
                    }}
                />
                {depth === 1 ? (
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 7}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={14}
                        fontWeight="bold"
                        style={{ pointerEvents: 'none', mixBlendMode: 'difference' }}
                    >
                        {name}
                    </text>
                ) : null}
                {depth === 1 && (
                    <text
                        x={x + 4}
                        y={y + 18}
                        fill="#000"
                        fontSize={12}
                        fillOpacity={0.6}
                        fontWeight="bold"
                    >
                        {name}
                    </text>
                )}
            </g>
        );
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { name, value, size } = payload[0].payload;
            return (
                <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                    <p className="font-semibold text-foreground">{name}</p>
                    <p className="text-sm text-primary">{size || value} Facilities</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Facility Distribution Map</h3>
                    <p className="text-sm text-muted-foreground mt-1">Hierarchical view of facility types by region</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md">
                    <Icon name="Grid" size={16} />
                    <span className="text-sm font-medium">Treemap</span>
                </div>
            </div>

            {(!data || data.length === 0) ? (
                <div className="w-full h-96 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
                    <div className="text-center text-muted-foreground">
                        <Icon name="LayoutGrid" size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No distribution data available</p>
                    </div>
                </div>
            ) : (
                <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={data}
                            dataKey="size"
                            ratio={4 / 3}
                            stroke="#fff"
                            fill="#3B82F6"
                        >
                            <Tooltip content={<CustomTooltip />} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                <span>Size represents number of facilities</span>
                <span>Grouped by Region {'>'} Province {'>'} Type</span>
            </div>
        </div>
    );
};

export default FacilityDistributionTreemap;
