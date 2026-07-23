import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const PhotoUploadQueue = ({ photos, onPhotosChange }) => {
  const [uploadProgress, setUploadProgress] = useState({});

  // Use photos from props, defaulting to empty array
  const displayPhotos = photos || [];

  const handleFileSelect = (event) => {
    const files = Array.from(event?.target?.files || []);
    if (files.length === 0) return;

    const newPhotos = files.map((file, index) => ({
      id: Date.now() + index, // Temp ID
      url: URL.createObjectURL(file), // Local preview
      alt: file.name,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploaded', // Simulating immediate upload for now
      type: 'Upload',
      file: file // Keep reference if needed for actual FormData upload later
    }));

    const updatedList = [...displayPhotos, ...newPhotos];
    onPhotosChange(updatedList);

    // Reset input
    event.target.value = '';
  };

  const handleRemovePhoto = (photoId) => {
    const updatedPhotos = displayPhotos.filter(p => p.id !== photoId);
    if (onPhotosChange) {
      onPhotosChange(updatedPhotos);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Icon name="Image" size={16} />
          Verification Photos
        </h3>
        <span className="text-xs text-muted-foreground">{displayPhotos?.length}/10</span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin mb-4">
        {displayPhotos?.map((photo) =>
          <div key={photo?.id} className="border border-border rounded-md overflow-hidden">
            <div className="relative h-24 bg-muted overflow-hidden">
              <Image
                src={photo?.url}
                alt={photo?.alt}
                className="w-full h-full object-cover" />

              {photo?.status === 'uploading' &&
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-foreground font-medium">{photo?.progress}%</p>
                  </div>
                </div>
              }
            </div>
            <div className="p-2">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{photo?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{photo?.size}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-primary">{photo?.type}</span>
                  </div>
                </div>
                {photo?.status === 'uploaded' &&
                  <button
                    onClick={() => handleRemovePhoto(photo?.id)}
                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-error/10 transition-colors">

                    <Icon name="X" size={14} className="text-error" />
                  </button>
                }
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <label className="block">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden" />

          <Button
            variant="outline"
            fullWidth
            iconName="Upload"
            iconPosition="left"
            asChild>

            <span>Upload Photos</span>
          </Button>
        </label>
        <label className="block">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            fullWidth
            iconName="Camera"
            iconPosition="left"
            asChild
          >
            <span>Capture 360° View</span>
          </Button>
        </label>
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="Info" size={12} />
          <span>Max 10 photos, 5MB each</span>
        </div>
      </div>
    </div>);

};

export default PhotoUploadQueue;