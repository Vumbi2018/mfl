import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PhotoDocumentation = ({ isOpen, onClose, ticket, onUpload }) => {
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  const handleCameraCapture = () => {
    if (fileInputRef?.current) {
      fileInputRef?.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files?.map(file => ({
      file,
      url: URL.createObjectURL(file),
      description: '',
      timestamp: new Date().toISOString()
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = photos?.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const handleUpdateDescription = (index, description) => {
    const newPhotos = [...photos];
    newPhotos[index].description = description;
    setPhotos(newPhotos);
  };

  const handleUpload = () => {
    if (photos?.length === 0) {
      alert('Please capture at least one photo');
      return;
    }
    onUpload?.(photos);
    setPhotos([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-card border border-border rounded-t-2xl md:rounded-lg shadow-lg w-full md:max-w-2xl mx-0 md:mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Camera" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Photo Documentation</h2>
              <p className="text-xs text-muted-foreground">Capture equipment condition with metadata</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Camera Capture Button */}
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="default"
              size="lg"
              fullWidth
              iconName="Camera"
              iconPosition="left"
              onClick={handleCameraCapture}
            >
              Capture Photo
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Photos will include location and timestamp automatically
            </p>
          </div>

          {/* Photo Preview Grid */}
          {photos?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Captured Photos ({photos?.length})
              </h3>
              <div className="space-y-3">
                {photos?.map((photo, index) => (
                  <div key={index} className="bg-muted/30 rounded-lg overflow-hidden">
                    <div className="relative">
                      <img
                        src={photo?.url}
                        alt={`Equipment photo ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error text-white flex items-center justify-center"
                      >
                        <Icon name="X" size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-foreground">
                        {new Date(photo?.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="p-3">
                      <input
                        type="text"
                        value={photo?.description}
                        onChange={(e) => handleUpdateDescription(index, e.target.value)}
                        placeholder="Add photo description..."
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Info */}
          <div className="bg-info/10 border border-info/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-info mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-info mb-1">Automatic Metadata</p>
                <p className="text-xs text-info/80">
                  Photos include GPS coordinates, timestamp, ticket reference, and equipment ID
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t border-border">
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
            iconName="Upload"
            iconPosition="left"
            onClick={handleUpload}
            disabled={photos?.length === 0}
          >
            Upload {photos?.length > 0 && `(${photos?.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoDocumentation;