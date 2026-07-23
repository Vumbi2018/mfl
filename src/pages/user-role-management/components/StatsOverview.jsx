import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsOverview = ({ stats, roles = [], groups = [] }) => {
  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: 'Users',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'Registered accounts'
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers ?? 0,
      icon: 'UserCheck',
      color: 'text-success',
      bgColor: 'bg-success/10',
      percentage: stats?.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0,
      description: 'Currently active'
    },
    {
      label: 'System Roles',
      value: roles?.length ?? stats?.rolesCount ?? 5,
      icon: 'Shield',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      description: 'Access levels defined'
    },
    {
      label: 'User Groups',
      value: groups?.length ?? stats?.groupsCount ?? 0,
      icon: 'FolderKanban',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      description: 'Organizational units'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards?.map((stat, index) => (
        <div
          key={index}
          className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-11 h-11 rounded-xl ${stat?.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <Icon name={stat?.icon} size={22} className={stat?.color} />
            </div>
            {stat?.percentage !== undefined && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.percentage >= 80 ? 'bg-success/10 text-success' :
                  stat.percentage >= 50 ? 'bg-warning/10 text-warning' :
                    'bg-error/10 text-error'
                }`}>
                {stat.percentage}%
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {typeof stat?.value === 'number' ? stat.value.toLocaleString() : stat?.value}
          </div>
          <div className="text-sm font-medium text-foreground">{stat?.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{stat?.description}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;