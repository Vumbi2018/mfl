import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'j', description: 'Select next submission' },
    { key: 'k', description: 'Select previous submission' },
    { key: 'a', description: 'Approve selected submission' },
    { key: 'r', description: 'Reject selected submission' },
    { key: 'c', description: 'Add comment to submission' },
    { key: 'e', description: 'Escalate submission' },
    { key: '/', description: 'Focus search filter' },
    { key: 'Esc', description: 'Close modal or clear selection' },
    { key: '?', description: 'Show keyboard shortcuts' }
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-card-lg w-full max-w-2xl mx-4 animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Icon name="Keyboard" size={24} />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {shortcuts?.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">{shortcut?.description}</span>
                <kbd className="px-3 py-1.5 text-xs font-semibold text-foreground bg-background border border-border rounded-md shadow-sm">
                  {shortcut?.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;