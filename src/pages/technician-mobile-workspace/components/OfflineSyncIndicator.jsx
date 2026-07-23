import React from 'react';
import Icon from '../../../components/AppIcon';

const OfflineSyncIndicator = ({ isOnline }) => {
  if (isOnline) {
    return (
      <div className="bg-success/10 border border-success/20 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Icon name="Wifi" size={16} className="text-success" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Online</p>
            <p className="text-xs text-success/80">All data synchronized</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
      <div className="flex items-center gap-2">
        <Icon name="WifiOff" size={16} className="text-warning" />
        <div className="flex-1">
          <p className="text-sm font-medium text-warning">Offline Mode</p>
          <p className="text-xs text-warning/80">Changes will sync when online</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
      </div>
    </div>
  );
};

export default OfflineSyncIndicator;