import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import api from '../../../utils/api';

const ChangeHistory = ({ facilityId }) => {
  const [selectedChange, setSelectedChange] = useState(null);
  const [changeHistory, setChangeHistory] = useState([]);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [allChanges, setAllChanges] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const url = facilityId ? `/audit/logs?facility_id=${facilityId}&limit=5` : '/audit/logs?limit=5';
        const response = await api.get(url);
        setChangeHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, [facilityId]);

  const handleViewAll = async () => {
    setShowViewAllModal(true);
    setLoadingAll(true);
    try {
      const url = facilityId ? `/audit/logs?facility_id=${facilityId}&limit=200` : '/audit/logs?limit=200';
      const response = await api.get(url);
      setAllChanges(response.data);
    } catch (err) {
      console.error("Failed to fetch all history:", err);
    } finally {
      setLoadingAll(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'Updated':
      case 'UPDATE':
        return 'Edit';
      case 'Added':
      case 'CREATE':
        return 'Plus';
      case 'Modified':
        return 'RefreshCw';
      case 'DELETE':
        return 'Trash2';
      default:
        return 'Activity';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
      case 'Added':
        return 'text-success';
      case 'DELETE':
        return 'text-error';
      case 'UPDATE':
      case 'Updated':
      case 'Modified':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: 'workflow-badge approved',
      pending: 'workflow-badge pending',
      rejected: 'workflow-badge rejected'
    };
    return badges?.[status] || 'workflow-badge pending';
  };

  const formatDetails = (details) => {
    if (!details) return null;
    if (typeof details === 'string') {
      try {
        return JSON.parse(details);
      } catch {
        return { description: details };
      }
    }
    return details;
  };

  const groupByDate = (changes) => {
    const groups = {};
    changes.forEach(change => {
      const dateKey = change?.date?.split(' ')[0] || 'Unknown';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(change);
    });
    return groups;
  };

  const ChangeItem = ({ change }) => {
    const details = formatDetails(change?.details);
    const isSelected = selectedChange?.id === change?.id;

    return (
      <div
        className={`p-3 rounded-md border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
        onClick={() => setSelectedChange(isSelected ? null : change)}
      >
        <div className="flex items-start gap-2 mb-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded bg-muted`}>
            <Icon name={getActionIcon(change?.action)} size={14} className={getActionColor(change?.action)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-medium text-foreground">
                {details?.field || change?.action || 'Change'}
              </p>
              {details?.status && (
                <span className={getStatusBadge(details.status)}>
                  {details.status}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {change?.action} {change?.username ? `by ${change.username}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">{change?.date}</p>
          </div>
        </div>
        {isSelected && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {details?.oldValue && (
              <div className="flex items-start gap-2">
                <Icon name="Minus" size={14} className="text-error mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Previous Value:</p>
                  <p className="text-xs text-foreground font-medium break-all">{String(details.oldValue)}</p>
                </div>
              </div>
            )}
            {details?.newValue && (
              <div className="flex items-start gap-2">
                <Icon name="Plus" size={14} className="text-success mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">New Value:</p>
                  <p className="text-xs text-foreground font-medium break-all">{String(details.newValue)}</p>
                </div>
              </div>
            )}
            {details?.description && (
              <div className="flex items-start gap-2">
                <Icon name="FileText" size={14} className="text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-foreground">{details.description}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Icon name="History" size={16} />
            Change History
          </h3>
          <button
            className="text-xs text-primary hover:underline flex items-center gap-1"
            onClick={handleViewAll}
          >
            View All
            <Icon name="ExternalLink" size={12} />
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
          {changeHistory?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Icon name="History" size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No changes recorded yet</p>
            </div>
          ) : (
            changeHistory?.map((change) => (
              <ChangeItem key={change?.id} change={change} />
            ))
          )}
        </div>
      </div>

      {/* View All Modal */}
      {showViewAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Icon name="History" size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Change History</h2>
                  <p className="text-xs text-muted-foreground">
                    {allChanges?.length || 0} changes recorded
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowViewAllModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Icon name="X" size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingAll ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : allChanges?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="History" size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No changes recorded for this facility</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupByDate(allChanges)).map(([date, changes]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-3 sticky top-0 bg-card py-1">
                        <Icon name="Calendar" size={14} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {date}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({changes.length} change{changes.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <div className="space-y-2 pl-2 border-l-2 border-border">
                        {changes.map((change) => (
                          <ChangeItem key={change?.id} change={change} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowViewAllModal(false)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
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

export default ChangeHistory;