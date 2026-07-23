import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TaskQueueTable = ({ tasks, selectedTask, onSelectTask, onBulkAction }) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'submissionDate', direction: 'desc' });

  const handleSelectAll = (e) => {
    if (e?.target?.checked) {
      setSelectedItems(new Set(tasks.map(t => t.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected?.has(id)) {
      newSelected?.delete(id);
    } else {
      newSelected?.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-error';
      case 'high': return 'text-warning';
      case 'medium': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning';
      case 'in-review': return 'bg-primary/10 text-primary';
      case 'escalated': return 'bg-error/10 text-error';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDaysRemainingColor = (days) => {
    if (days <= 1) return 'text-error font-semibold';
    if (days <= 3) return 'text-warning font-medium';
    return 'text-muted-foreground';
  };

  const sortedTasks = [...tasks]?.sort((a, b) => {
    const aValue = a?.[sortConfig?.key];
    const bValue = b?.[sortConfig?.key];
    
    if (sortConfig?.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg">
      {/* Bulk Actions Bar */}
      {selectedItems?.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border">
          <span className="text-sm font-medium text-foreground">
            {selectedItems?.size} item{selectedItems?.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkAction('approve', Array.from(selectedItems))}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-success hover:bg-success/10 rounded-md transition-colors"
            >
              <Icon name="CheckCircle" size={16} />
              Approve All
            </button>
            <button
              onClick={() => onBulkAction('reject', Array.from(selectedItems))}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 rounded-md transition-colors"
            >
              <Icon name="XCircle" size={16} />
              Reject All
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Icon name="X" size={16} />
              Clear
            </button>
          </div>
        </div>
      )}
      {/* Table Header */}
      <div className="flex items-center px-4 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="w-10">
          <input
            type="checkbox"
            checked={selectedItems?.size === tasks?.length && tasks?.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-border"
          />
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSort('facilityName')}>
          <div className="flex items-center gap-1">
            Facility
            <Icon name="ArrowUpDown" size={12} />
          </div>
        </div>
        <div className="w-40 cursor-pointer" onClick={() => handleSort('submitter')}>
          <div className="flex items-center gap-1">
            Submitter
            <Icon name="ArrowUpDown" size={12} />
          </div>
        </div>
        <div className="w-32 cursor-pointer" onClick={() => handleSort('submissionDate')}>
          <div className="flex items-center gap-1">
            Submitted
            <Icon name="ArrowUpDown" size={12} />
          </div>
        </div>
        <div className="w-24 cursor-pointer" onClick={() => handleSort('priority')}>
          <div className="flex items-center gap-1">
            Priority
            <Icon name="ArrowUpDown" size={12} />
          </div>
        </div>
        <div className="w-28">Status</div>
        <div className="w-24 text-right">Days Left</div>
      </div>
      {/* Table Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sortedTasks?.map((task) => (
          <div
            key={task?.id}
            onClick={() => onSelectTask(task)}
            className={`flex items-center px-4 py-3 border-b border-border cursor-pointer transition-colors ${
              selectedTask?.id === task?.id ? 'bg-primary/5' : 'hover:bg-muted/50'
            }`}
          >
            <div className="w-10">
              <input
                type="checkbox"
                checked={selectedItems?.has(task?.id)}
                onChange={(e) => {
                  e?.stopPropagation();
                  handleSelectItem(task?.id);
                }}
                className="w-4 h-4 rounded border-border"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <Image
                    src={task?.facilityImage}
                    alt={task?.facilityImageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task?.facilityName}</p>
                  <p className="text-xs text-muted-foreground truncate">{task?.location}</p>
                </div>
              </div>
            </div>
            <div className="w-40">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                  <Image
                    src={task?.submitterAvatar}
                    alt={task?.submitterAvatarAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm text-foreground truncate">{task?.submitter}</span>
              </div>
            </div>
            <div className="w-32">
              <span className="text-sm text-foreground">{task?.submissionDate}</span>
            </div>
            <div className="w-24">
              <div className="flex items-center gap-1">
                <Icon name="AlertCircle" size={14} className={getPriorityColor(task?.priority)} />
                <span className={`text-xs font-medium capitalize ${getPriorityColor(task?.priority)}`}>
                  {task?.priority}
                </span>
              </div>
            </div>
            <div className="w-28">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task?.status)}`}>
                {task?.status === 'escalated' && <Icon name="TrendingUp" size={12} />}
                {task?.status}
              </span>
            </div>
            <div className="w-24 text-right">
              <span className={`text-sm ${getDaysRemainingColor(task?.daysRemaining)}`}>
                {task?.daysRemaining}d
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          Showing {tasks?.length} of {tasks?.length} submissions
        </span>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <span className="text-sm text-foreground">Page 1 of 1</span>
          <button className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskQueueTable;