import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActionsToolbar = ({ selectedCount, onClearSelection, onBulkAction }) => {
  const [bulkAction, setBulkAction] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const bulkActionOptions = [
    { value: '', label: 'Select Action' },
    { value: 'approve', label: 'Approve Selected' },
    { value: 'reject', label: 'Reject Selected' },
    { value: 'export', label: 'Export Selected' },
    { value: 'delete', label: 'Delete Selected' },
    { value: 'assign', label: 'Assign Coordinator' }
  ];

  const handleApplyAction = () => {
    if (!bulkAction) return;
    setShowConfirmation(true);
  };

  const handleConfirmAction = () => {
    onBulkAction(bulkAction);
    setShowConfirmation(false);
    setBulkAction('');
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-card-lg p-4 z-30 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{selectedCount}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {selectedCount} {selectedCount === 1 ? 'facility' : 'facilities'} selected
            </span>
          </div>

          <div className="w-px h-6 bg-border" />

          <div className="w-64">
            <Select
              options={bulkActionOptions}
              value={bulkAction}
              onChange={setBulkAction}
              placeholder="Choose action"
            />
          </div>

          <Button
            variant="default"
            onClick={handleApplyAction}
            disabled={!bulkAction}
            iconName="Play"
            iconPosition="left"
          >
            Apply
          </Button>

          <Button
            variant="ghost"
            onClick={onClearSelection}
            iconName="X"
            iconPosition="left"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-card border border-border rounded-lg shadow-card-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Icon name="AlertTriangle" size={20} className="text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Confirm Bulk Action</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to {bulkAction} {selectedCount} {selectedCount === 1 ? 'facility' : 'facilities'}? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmAction}
                iconName="CheckCircle"
                iconPosition="left"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsToolbar;