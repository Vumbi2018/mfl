import React from 'react';
import Icon from '../../../components/AppIcon';

const WorkflowHeader = ({ stats, userRole, onConfigureWorkflow }) => {
  const statCards = [
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals,
      icon: 'Clock',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'In Review',
      value: stats?.inReview,
      icon: 'Eye',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Escalated',
      value: stats?.escalated,
      icon: 'TrendingUp',
      color: 'text-error',
      bgColor: 'bg-error/10'
    },
    {
      label: 'Approved Today',
      value: stats?.approvedToday,
      icon: 'CheckCircle',
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Workflow Management Console</h1>
          <p className="text-sm text-muted-foreground">
            Manage facility submissions and approvals • Role: <span className="font-medium text-foreground">{userRole}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors">
            <Icon name="Download" size={16} />
            Export Report
          </button>
          <button
            onClick={onConfigureWorkflow}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors">
            <Icon name="Settings" size={16} />
            Configure Workflow
          </button>
          <button
            onClick={() => window.location.href = '/mobile-field-collection-app'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors shadow-sm">
            <Icon name="Plus" size={16} />
            New Submission
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {statCards?.map((stat, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className={`w-12 h-12 rounded-lg ${stat?.bgColor} flex items-center justify-center`}>
              <Icon name={stat?.icon} size={24} className={stat?.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat?.value}</p>
              <p className="text-xs text-muted-foreground">{stat?.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Icon name="Info" size={16} className="text-primary" />
        <p className="text-sm text-foreground">
          <span className="font-medium">SLA Status:</span> System check running...
        </p>
      </div>
    </div>
  );
};

export default WorkflowHeader;