import React from 'react';
import Icon from '../../../components/AppIcon';

const UserActivityMetrics = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return 'LogIn';
      case 'approval': return 'CheckCircle';
      case 'edit': return 'Edit';
      case 'export': return 'Download';
      case 'search': return 'Search';
      default: return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'login': return 'text-primary';
      case 'approval': return 'text-success';
      case 'edit': return 'text-warning';
      case 'export': return 'text-accent';
      case 'search': return 'text-secondary';
      default: return 'text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date?.toLocaleDateString();
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">User Activity Stream</h3>
          <p className="text-sm text-muted-foreground mt-1">Recent system interactions</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
          <Icon name="Filter" size={16} />
          Filter
        </button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
        {activities?.map((activity) => (
          <div key={activity?.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-muted ${getActivityColor(activity?.type)}`}>
              <Icon name={getActivityIcon(activity?.type)} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{activity?.user}</span>
                <span className="text-xs text-muted-foreground">{formatTimestamp(activity?.timestamp)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{activity?.action}</p>
              {activity?.details && (
                <div className="mt-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {activity?.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <button className="w-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
          View Full Activity Log
        </button>
      </div>
    </div>
  );
};

export default UserActivityMetrics;