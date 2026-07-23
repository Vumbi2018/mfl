import React from 'react';
import Icon from '../../../components/AppIcon';

const ApprovalWorkflowStatus = ({ workflowStatus }) => {
  const statusSteps = [
    {
      level: 'District Coordinator',
      status: workflowStatus?.district || 'pending',
      date: workflowStatus?.district_date || null,
      user: workflowStatus?.district_user || null
    },
    {
      level: 'Province Coordinator',
      status: workflowStatus?.province || 'pending',
      date: workflowStatus?.province_date || null,
      user: workflowStatus?.province_user || null
    },
    {
      level: 'National Administrator',
      status: workflowStatus?.national || 'pending',
      date: workflowStatus?.national_date || null,
      user: workflowStatus?.national_user || null
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return 'CheckCircle';
      case 'rejected':
        return 'XCircle';
      case 'pending':
        return 'Clock';
      default:
        return 'Circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-success';
      case 'rejected':
        return 'text-error';
      case 'pending':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="GitMerge" size={16} />
        Approval Workflow
      </h3>
      <div className="space-y-4">
        {statusSteps?.map((step, index) => (
          <div key={index} className="relative">
            {index < statusSteps?.length - 1 && (
              <div className="absolute left-4 top-10 w-0.5 h-8 bg-border" />
            )}
            <div className="flex items-start gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step?.status === 'approved' ? 'border-success bg-success/10' :
                step?.status === 'rejected' ? 'border-error bg-error/10' :
                  step?.status === 'pending' ? 'border-warning bg-warning/10 ring-4 ring-warning/20' : 'border-border bg-muted'
                }`}>
                <Icon name={getStatusIcon(step?.status)} size={16} className={getStatusColor(step?.status) || ''} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{step?.level}</p>
                <p className="text-xs text-muted-foreground capitalize">{step?.status}</p>
                {step?.user && (
                  <p className="text-xs text-muted-foreground mt-1">
                    By {step?.user}
                  </p>
                )}
                {step?.date && (
                  <p className="text-xs text-muted-foreground">
                    {step?.date}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalWorkflowStatus;