import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const UserProfilePanel = ({ user, onClose, onAction }) => {
  const [activeTab, setActiveTab] = useState('permissions');

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Icon name="UserCircle" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select a user to view details</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'permissions', label: 'Permissions', icon: 'Shield' },
    { id: 'audit', label: 'Audit Trail', icon: 'FileText' },
    { id: 'sessions', label: 'Sessions', icon: 'Monitor' }
  ];

  const permissions = user?.permissions || [];

  const renderPermissionsProxy = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {permissions.length === 0 ? <p className="text-muted-foreground p-4">No specific permissions assigned.</p> : null}
        {permissions.map((p, i) => (
          <div key={i} className="p-3 bg-muted/30 rounded border border-border flex flex-col">
            <span className="font-semibold text-sm">{p.slug}</span>
            <span className="text-xs text-muted-foreground">{p.description}</span>
          </div>
        ))}
      </div>
    )
  };

  const auditLogs = [
    {
      id: 1,
      action: 'Role Changed',
      details: 'Changed from District Coordinator to Province Coordinator',
      timestamp: new Date(Date.now() - 7200000),
      performedBy: 'Admin User'
    },
    {
      id: 2,
      action: 'Permission Updated',
      details: 'Granted edit access to Workflow Approvals',
      timestamp: new Date(Date.now() - 86400000),
      performedBy: 'System Admin'
    }
  ];

  const activeSessions = [
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'New York, USA',
      ip: '192.168.1.100',
      lastActive: new Date(Date.now() - 300000),
      current: true
    }
  ];

  const formatTimestamp = (date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={user?.avatar}
                alt={user?.avatarAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.phone_number && <p className="text-xs text-muted-foreground mt-0.5">{user.phone_number}</p>}
              <div className="flex items-center gap-2 mt-2">
                <Icon name={user?.roleIcon || 'Shield'} size={14} className="text-primary" />
                <span className="text-sm text-foreground">{user?.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Jurisdiction Scope</div>
            <div className="text-sm font-medium text-foreground">
              {user?.is_national ? (
                <span className="text-indigo-600 flex items-center gap-1"><Icon name="Globe" size={12} /> National Level</span>
              ) : (
                user?.jurisdictions && user.jurisdictions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {user.jurisdictions.map((j, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {j.district_name || j.province_name || j.region_name}
                      </span>
                    ))}
                  </div>
                ) : <span className="text-gray-400 italic">Unassigned</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Primary Facility</div>
            <div className="text-sm font-medium text-foreground">{user?.facility_name || user?.department || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Department</div>
            <div className="text-sm font-medium text-foreground">{user?.department}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Last Login</div>
            <div className="text-sm font-medium text-foreground">{formatTimestamp(user?.lastLogin)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user?.status === 'active' ? 'text-success bg-success/10' : 'text-error bg-error/10'
              }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {user?.status}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="UserCog"
            iconPosition="left"
            onClick={() => onAction('changeRole', user)}
          >
            Change Role
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Ban"
            iconPosition="left"
            onClick={() => onAction('suspend', user)}
          >
            Suspend
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Key"
            iconPosition="left"
            onClick={() => onAction('resetPassword', user)}
          >
            Reset Password
          </Button>
        </div>
      </div>
      <div className="border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {activeTab === 'permissions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Assigned Permissions</h3>
            </div>
            <div className="space-y-3">
              {renderPermissionsProxy()}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-foreground">{log.action}</div>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="User" size={12} />
                    <span>By {log.performedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Active Sessions</h3>
              <Button variant="outline" size="sm" iconName="LogOut">
                Terminate All
              </Button>
            </div>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon name="Monitor" size={20} className="text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{session.device}</div>
                        <div className="text-sm text-muted-foreground">{session.location}</div>
                      </div>
                    </div>
                    {session.current && (
                      <span className="px-2 py-1 text-xs font-medium text-success bg-success/10 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      IP: {session.ip} • Last active {formatTimestamp(session.lastActive)}
                    </div>
                    {!session.current && (
                      <button className="text-error hover:underline">Terminate</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePanel;