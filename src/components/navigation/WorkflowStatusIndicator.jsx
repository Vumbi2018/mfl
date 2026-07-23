import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import api from '../../utils/api';

const WorkflowStatusIndicator = ({ isFixed = true }) => {
  const navigate = useNavigate();
  const [workflowStatus, setWorkflowStatus] = useState({
    pendingApprovals: 0,
    escalatedItems: 4,
    syncStatus: 'healthy',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Optionally fetch real stats here
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/summary'); // Or workflow specific endpoint
        if (res.data) {
          setWorkflowStatus(prev => ({
            ...prev,
            pendingApprovals: res.data.pendingApprovals !== undefined ? res.data.pendingApprovals : 0,
            escalatedItems: res.data.escalatedItems !== undefined ? res.data.escalatedItems : 4
          }));
        }
      } catch (e) {
        // console.error("Failed to fetch workflow stats", e);
      }
    }
    fetchStats();
  }, []);

  const getSyncStatusColor = () => {
    switch (workflowStatus?.syncStatus) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'success';
    }
  };

  const handleViewAll = () => {
    navigate('/workflow-console');
    setIsExpanded(false);
  };

  return (
    <div className={isFixed ? "fixed top-4 right-4 z-40" : "relative"}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg shadow-card hover:shadow-card-lg transition-all duration-200"
      >
        <Icon name="Bell" size={20} className="text-primary" />
        {(workflowStatus?.pendingApprovals > 0 || workflowStatus?.escalatedItems > 0) && (
          <span className={`workflow-badge ${workflowStatus.escalatedItems > 0 ? 'rejected' : 'pending'}`}>
            {workflowStatus.pendingApprovals + workflowStatus.escalatedItems}
          </span>
        )}
        <Icon
          name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          size={16}
          className="text-muted-foreground"
        />
      </button>
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-card-lg animate-fade-in z-50">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Workflow Status</h3>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Clock" size={16} className="text-warning" />
                <span className="text-sm text-foreground">Pending Approvals</span>
              </div>
              <span className="workflow-badge pending">
                {workflowStatus?.pendingApprovals}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} className="text-error" />
                <span className="text-sm text-foreground">Escalated Items</span>
              </div>
              <span className="workflow-badge rejected">
                {workflowStatus?.escalatedItems}
              </span>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Database" size={16} className="text-success" />
                  <span className="text-sm text-foreground">Sync Status</span>
                </div>
                <div className={`status-indicator ${getSyncStatusColor()}`}>
                  <Icon name="CheckCircle" size={14} />
                  <span className="capitalize">{workflowStatus?.syncStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <button
              onClick={handleViewAll}
              className="w-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              View All Workflows
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowStatusIndicator;