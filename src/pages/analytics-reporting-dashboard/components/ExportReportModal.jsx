import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportReportModal = ({ isOpen, onClose, onExport }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'pdf',
    dateRange: '30d',
    includeCharts: true,
    includeRawData: false,
    includeMetrics: true,
    includeAnalysis: true
  });

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV File' },
    { value: 'json', label: 'JSON Data' }
  ];

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleExport = () => {
    onExport(exportConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-card-lg w-full max-w-2xl mx-4 animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Export Analytics Report</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure your report export settings</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-muted transition-colors flex items-center justify-center"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Export Format"
              options={formatOptions}
              value={exportConfig?.format}
              onChange={(value) => setExportConfig({ ...exportConfig, format: value })}
            />
            <Select
              label="Date Range"
              options={dateRangeOptions}
              value={exportConfig?.dateRange}
              onChange={(value) => setExportConfig({ ...exportConfig, dateRange: value })}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Include in Report</h3>
            <div className="space-y-2">
              <Checkbox
                label="Charts and Visualizations"
                description="Include all charts and graphs from the dashboard"
                checked={exportConfig?.includeCharts}
                onChange={(e) => setExportConfig({ ...exportConfig, includeCharts: e?.target?.checked })}
              />
              <Checkbox
                label="Key Performance Metrics"
                description="Include summary metrics and KPIs"
                checked={exportConfig?.includeMetrics}
                onChange={(e) => setExportConfig({ ...exportConfig, includeMetrics: e?.target?.checked })}
              />
              <Checkbox
                label="Detailed Analysis"
                description="Include trend analysis and insights"
                checked={exportConfig?.includeAnalysis}
                onChange={(e) => setExportConfig({ ...exportConfig, includeAnalysis: e?.target?.checked })}
              />
              <Checkbox
                label="Raw Data Tables"
                description="Include underlying data in tabular format"
                checked={exportConfig?.includeRawData}
                onChange={(e) => setExportConfig({ ...exportConfig, includeRawData: e?.target?.checked })}
              />
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Export Information</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reports are generated based on your current access level and permissions. Large exports may take a few minutes to process.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" iconName="Download" iconPosition="left" onClick={handleExport}>
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;