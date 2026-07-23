import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const PhotoCaptureCard = ({ onPhotosCapture, gpsData }) => {
  const [photos, setPhotos] = useState([]);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Initial mock data removed to let user start fresh, or kept if requested? 
  // User asked for features, usually implies real usage. I'll keep one example or empty.
  // Let's keep empty for "real" feel, or just the state.

  const handleFileSelect = (e) => {
    const files = Array.from(e?.target?.files || []);
    if (files.length === 0) return;

    const newPhotos = files.map((file, index) => ({
      id: Date.now() + index,
      url: URL.createObjectURL(file), // Create local preview URL
      alt: file.name,
      file: file,
      timestamp: new Date().toISOString(),
      gpsTagged: !!gpsData, // Tag if GPS data is available from parent
      gpsData: gpsData || null,
      type: "Facility Photo"
    }));

    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    onPhotosCapture(updatedPhotos);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    // In a real PWA this might trigger camera API, 
    // for web we rely on file input accepting typical camera capture on mobile
    fileInputRef?.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef?.current?.click();
  };

  const handleDeletePhoto = (photoId) => {
    e?.stopPropagation(); // Prevent opening preview if clicking delete
    const updatedPhotos = photos.filter((photo) => photo.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosCapture(updatedPhotos);
    if (previewPhoto?.id === photoId) {
      setPreviewPhoto(null);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Camera" size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Photo Capture</h2>
          </div>
          <span className="text-sm text-muted-foreground">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="default"
            iconName="Camera"
            iconPosition="left"
            onClick={handleCameraClick}
            fullWidth
          >
            Take Photo
          </Button>
          <Button
            variant="outline"
            iconName="Image"
            iconPosition="left"
            onClick={handleUploadClick}
            fullWidth
          >
            Upload Photo
          </Button>
        </div>

        {photos.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewPhoto(photo)}
                  />

                  {/* Overlays */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      className="bg-error/90 hover:bg-error text-white p-1.5 rounded-full shadow-sm transition-colors"
                      title="Delete photo"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate max-w-[70%]">{photo.type}</span>
                      {photo.gpsTagged && (
                        <Icon name="MapPin" size={12} className="text-success" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
              <Icon name="Info" size={14} />
              <span>
                {gpsData ? "Photos will be geotagged with current location." : "Capture GPS to enable geotagging."}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="ImagePlus" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No photos captured yet</p>
            <p className="text-xs text-muted-foreground">Take photos or upload from gallery</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-background/95 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPreviewPhoto(null)}>
          <div className="max-w-4xl w-full bg-card rounded-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Photo Preview</h3>
              <Button variant="ghost" size="icon" onClick={() => setPreviewPhoto(null)}>
                <Icon name="X" size={20} />
              </Button>
            </div>
            <div className="p-4 bg-muted/30 flex justify-center">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.alt}
                className="max-h-[70vh] w-auto object-contain rounded-md shadow-sm"
              />
            </div>
            <div className="p-4 bg-card border-t border-border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Calendar" size={14} />
                    <span>{new Date(previewPhoto.timestamp).toLocaleString()}</span>
                  </div>
                  {previewPhoto.gpsTagged && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <Icon name="MapPin" size={14} />
                      <span>
                        {previewPhoto.gpsData
                          ? `${previewPhoto.gpsData.latitude.toFixed(6)}, ${previewPhoto.gpsData.longitude.toFixed(6)}`
                          : "Geotagged"
                        }
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  iconName="Trash2"
                  onClick={() => handleDeletePhoto(previewPhoto.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoCaptureCard;