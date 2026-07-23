import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActionModal = ({ isOpen, onClose, actionType, selectedCount, onConfirm }) => {
  const [selectedValue, setSelectedValue] = useState('');

  if (!isOpen) return null;

  const getModalContent = () => {
    switch (actionType) {
      case 'role':
        return {
          title: 'Change Role',
          description: `Change role for ${selectedCount} selected user${selectedCount > 1 ? 's' : ''}`,
          icon: 'UserCog',
          options: [
            { value: 'national-admin', label: 'National Administrator' },
            { value: 'province-coordinator', label: 'Province Coordinator' },
            { value: 'district-coordinator', label: 'District Coordinator' },
            { value: 'facility-user', label: 'Facility User' }
          ],
          placeholder: 'Select new role'
        };
      case 'jurisdiction':
        return {
          title: 'Reassign Jurisdiction',
          description: `Reassign jurisdiction for ${selectedCount} selected user${selectedCount > 1 ? 's' : ''}`,
          icon: 'MapPin',
          options: [
            { value: 'province-a', label: 'Province A' },
            { value: 'province-b', label: 'Province B' },
            { value: 'district-1', label: 'District 1' },
            { value: 'district-2', label: 'District 2' }
          ],
          placeholder: 'Select jurisdiction'
        };
      case 'suspend':
        return {
          title: 'Suspend Accounts',
          description: `Are you sure you want to suspend ${selectedCount} user account${selectedCount > 1 ? 's' : ''}? This action can be reversed later.`,
          icon: 'Ban',
          options: null,
          placeholder: null
        };
      default:
        return null;
    }
  };

  const content = getModalContent();

  const handleConfirm = () => {
    onConfirm(actionType, selectedValue);
    setSelectedValue('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-lg border border-border shadow-card-lg w-full max-w-md mx-4 animate-slide-in">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name={content?.icon} size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{content?.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{content?.description}</p>
        </div>

        <div className="p-6">
          {content?.options && (
            <Select
              label="Select option"
              options={content?.options}
              value={selectedValue}
              onChange={setSelectedValue}
              placeholder={content?.placeholder}
              required
            />
          )}

          {actionType === 'suspend' && (
            <div className="p-4 bg-error/10 rounded-lg border border-error/20">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" size={20} className="text-error flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">Warning</p>
                  <p className="text-muted-foreground">
                    Suspended users will lose access to the system immediately. They will not be able to log in until their accounts are reactivated.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={actionType === 'suspend' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={content?.options && !selectedValue}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;