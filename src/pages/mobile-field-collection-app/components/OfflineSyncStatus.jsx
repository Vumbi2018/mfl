import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OfflineSyncStatus = ({ pendingCount = 0, onSync, isSyncing = false, lastSyncTime }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTimeSinceSync = () => {
    if (!lastSyncTime) return 'Never';
    const diffMinutes = Math.floor((new Date() - new Date(lastSyncTime)) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name={isOnline ? 'Wifi' : 'WifiOff'} size={20} className={isOnline ? 'text-success' : 'text-error'} />
            <span className="font-medium text-foreground">
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>
          <div className={`status-indicator ${isOnline ? 'success' : 'error'}`}>
            <Icon name={isOnline ? 'CheckCircle' : 'AlertCircle'} size={14} />
            <span>{isOnline ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Icon name="CloudOff" size={16} className="text-warning" />
              <span className="text-sm text-foreground">{pendingCount} item{pendingCount !== 1 ? 's' : ''} pending sync</span>
            </div>
            {isOnline && (
              <Button
                variant="outline"
                size="sm"
                iconName="RefreshCw"
                iconPosition="left"
                onClick={onSync}
                loading={isSyncing}
              >
                Sync Now
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last synced</span>
          <div className="flex items-center gap-1 text-foreground">
            <Icon name="Clock" size={14} />
            <span>{getTimeSinceSync()}</span>
          </div>
        </div>

        {!isOnline && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Icon name="Info" size={16} className="text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              You're working offline. Your changes will be automatically synced when connection is restored.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineSyncStatus;