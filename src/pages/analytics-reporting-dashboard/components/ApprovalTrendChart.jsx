import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const ApprovalTrendChart = ({ data, timeRange, onTimeRangeChange }) => {
  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Approval Processing Trends</h3>
          <p className="text-sm text-muted-foreground mt-1">Average processing time by approval tier</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">No Data Available</span>
        </div>
      </div>
      {(!data || data.length === 0) ? (
        <div className="w-full h-80 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
          <div className="text-center text-muted-foreground">
            <Icon name="BarChart2" size={32} className="mx-auto mb-2 opacity-50" />
            <p>No trend data available yet</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-80" aria-label="Approval Processing Trends Line Chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
                label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="district"
                stroke="#2563EB"
                strokeWidth={2}
                name="District Level"
                dot={{ fill: '#2563EB', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="province"
                stroke="#059669"
                strokeWidth={2}
                name="Province Level"
                dot={{ fill: '#059669', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="national"
                stroke="#F59E0B"
                strokeWidth={2}
                name="National Level"
                dot={{ fill: '#F59E0B', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ApprovalTrendChart;