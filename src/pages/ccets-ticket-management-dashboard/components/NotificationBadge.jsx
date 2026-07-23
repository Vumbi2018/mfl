import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const NotificationBadge = ({ notifications }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const totalCount = notifications?.reduce((sum, n) => sum + n?.count, 0);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new': return 'Bell';
      case 'urgent': return 'AlertTriangle';
      case 'escalated': return 'ArrowUp';
      default: return 'Bell';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'urgent': return 'text-error';
      case 'escalated': return 'text-warning';
      default: return 'text-primary';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        iconName="Bell"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative"
      >
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
            {totalCount}
          </span>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications?.map(notification => (
              <div key={notification?.id} className="p-4 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <Icon 
                    name={getNotificationIcon(notification?.type)} 
                    size={20} 
                    className={getNotificationColor(notification?.type)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {notification?.count} {notification?.type} tickets
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requires your attention
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              fullWidth
              size="sm"
              onClick={() => console.log('View all notifications')}
            >
              View All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;