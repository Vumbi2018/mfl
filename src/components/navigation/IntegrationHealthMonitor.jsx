import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import api from '../../utils/api';

const IntegrationHealthMonitor = () => {
  const [integrationStatus, setIntegrationStatus] = useState({
    apiHealth: 'healthy',
    databaseSync: 'healthy',
    externalServices: 'healthy',
    lastSync: new Date()?.toISOString(),
    latency: null,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        const res = await api.get('/health');
        const latency = Date.now() - start;

        // Axios throws on error, so if we are here, it's 2xx
        const data = res.data;
        setIntegrationStatus({
          apiHealth: 'healthy',
          databaseSync: data.database === 'connected' ? 'healthy' : 'error',
          externalServices: 'healthy',
          lastSync: data.timestamp || new Date().toISOString(),
          latency: latency
        });
      } catch (error) {
        console.error("Health check failed:", error);
        setIntegrationStatus(prev => ({ ...prev, apiHealth: 'error', databaseSync: 'unknown', lastSync: new Date().toISOString(), latency: 0 }));
      }
    };

    // Check immediately then every 60s
    checkHealth();
    const interval = setInterval(checkHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = () => {
    const statuses = [
      integrationStatus?.apiHealth,
      integrationStatus?.databaseSync,
      integrationStatus?.externalServices,
    ];

    if (statuses?.includes('error')) return 'error';
    if (statuses?.includes('warning')) return 'warning';
    return 'healthy';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return 'CheckCircle';
      case 'warning':
        return 'AlertCircle';
      case 'error':
        return 'XCircle';
      default:
        return 'HelpCircle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'muted';
    }
  };

  const formatLastSync = () => {
    const date = new Date(integrationStatus.lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  const overallStatus = getOverallStatus();

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${isExpanded ? 'bg-muted' : 'hover:bg-muted'
            }`}
          title="Integration Health Status"
        >
          <div className={`status-indicator ${getStatusColor(overallStatus)} p-0 bg-transparent`}>
            <Icon name={getStatusIcon(overallStatus)} size={16} />
          </div>
          <span className="text-sm font-medium text-foreground">System Health</span>
          <Icon
            name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
            size={14}
            className="text-muted-foreground"
          />
        </button>
        {isExpanded && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-card-lg animate-fade-in z-50">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Integration Health</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {formatLastSync()}
              </p>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Server" size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">API Health</span>
                </div>
                <div className={`status-indicator ${getStatusColor(integrationStatus?.apiHealth)}`}>
                  <Icon name={getStatusIcon(integrationStatus?.apiHealth)} size={14} />
                  <span className="capitalize">{integrationStatus?.apiHealth}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Database" size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Database Sync</span>
                </div>
                <div className={`status-indicator ${getStatusColor(integrationStatus?.databaseSync)}`}>
                  <Icon name={getStatusIcon(integrationStatus?.databaseSync)} size={14} />
                  <span className="capitalize">{integrationStatus?.databaseSync}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Cloud" size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">External Services</span>
                </div>
                <div className={`status-indicator ${getStatusColor(integrationStatus?.externalServices)}`}>
                  <Icon name={getStatusIcon(integrationStatus?.externalServices)} size={14} />
                  <span className="capitalize">{integrationStatus?.externalServices}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setShowDetails(true);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
              >
                View Detailed Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Status Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Icon name="Activity" size={20} />
                System Health Details
              </h2>
              <button onClick={() => setShowDetails(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/40 rounded-md">
                  <h4 className="text-xs uppercase text-muted-foreground font-semibold mb-2">API Status</h4>
                  <div className="flex items-center gap-2">
                    <Icon name={getStatusIcon(integrationStatus.apiHealth)} className={`text-${getStatusColor(integrationStatus.apiHealth)}`} />
                    <span className="font-medium capitalize">{integrationStatus.apiHealth}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Endpoint: /api/health</p>
                  <div className="mt-2 text-xs flex justify-between">
                    <span>Latency:</span>
                    <span className="font-mono">{integrationStatus.latency ? `${integrationStatus.latency}ms` : '-'}</span>
                  </div>
                </div>

                <div className="p-4 bg-muted/40 rounded-md">
                  <h4 className="text-xs uppercase text-muted-foreground font-semibold mb-2">Database Connection</h4>
                  <div className="flex items-center gap-2">
                    <Icon name={getStatusIcon(integrationStatus.databaseSync)} className={`text-${getStatusColor(integrationStatus.databaseSync)}`} />
                    <span className="font-medium capitalize">{integrationStatus.databaseSync}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">PostgreSQL DB</p>
                </div>
              </div>

              <div className="p-4 bg-muted/20 rounded-md border border-border/50">
                <h4 className="text-sm font-medium mb-2">Diagnostics</h4>
                <div className="space-y-2 text-xs font-mono text-muted-foreground">
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span>Last Sync Timestamp:</span>
                    <span>{integrationStatus.lastSync}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span>Client Time:</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Environment:</span>
                    <span>{import.meta.env.MODE}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted"
              >
                Reload App
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IntegrationHealthMonitor;