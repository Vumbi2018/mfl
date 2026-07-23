import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportModal = ({ isOpen, onClose, onExport }) => {
  const [exportFormat, setExportFormat] = useState('excel');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeImages, setIncludeImages] = useState(false);

  const formatOptions = [
    { value: 'geojson', label: 'GeoJSON' },
    { value: 'kml', label: 'KML' },
    { value: 'csv', label: 'CSV' },
    { value: 'excel', label: 'Excel (XLSX)' },
    { value: 'pdf', label: 'PDF Report' }
  ];

  const handleExport = () => {
    onExport({
      format: exportFormat,
      includeMetadata,
      includeImages
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-card-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="Download" size={20} className="text-primary" />
            <h3 className="font-semibold text-foreground">Export Facilities</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <Select
            label="Export Format"
            description="Choose the file format for export"
            options={formatOptions}
            value={exportFormat}
            onChange={setExportFormat}
          />

          <div className="space-y-2">
            <div className="text-sm font-semibold text-foreground mb-2">Export Options</div>
            <Checkbox
              label="Include Metadata"
              description="Export facility metadata and audit information"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e?.target?.checked)}
            />
            <Checkbox
              label="Include Images"
              description="Export facility photos (increases file size)"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e?.target?.checked)}
            />
          </div>

          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-primary mt-0.5" />
              <div className="text-xs text-muted-foreground">
                The export will include all facilities matching your current filters. Large exports may take a few moments to process.
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            fullWidth
            onClick={handleExport}
            iconName="Download"
            iconPosition="left"
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;