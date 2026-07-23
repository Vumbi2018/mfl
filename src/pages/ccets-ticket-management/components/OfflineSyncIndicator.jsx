import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const OfflineSyncIndicator = ({ isOnline }) => {
  const pendingActions = JSON.parse(localStorage.getItem('ccets_pending_actions') || '[]');
  const hasPendingActions = pendingActions?.length > 0;

  return (
    <div className="flex items-center space-x-2">
      {isOnline ? (
        <>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Online</span>
          </div>
          {hasPendingActions && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Syncing {pendingActions?.length} items...</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Offline Mode</span>
          {hasPendingActions && (
            <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-bold">
              {pendingActions?.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineSyncIndicator;