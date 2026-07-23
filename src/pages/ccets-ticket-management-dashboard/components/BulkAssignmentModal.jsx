import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkAssignmentModal = ({ isOpen, onClose, selectedTickets, onAssign }) => {
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Mock technicians with workload
  const technicians = [
    { id: 'tech1', name: 'John Kama', currentWorkload: 3, location: 'Mt Hagen', status: 'available' },
    { id: 'tech2', name: 'Michael Tau', currentWorkload: 5, location: 'Port Moresby', status: 'busy' },
    { id: 'tech3', name: 'Peter Wari', currentWorkload: 2, location: 'Wabag', status: 'available' },
    { id: 'tech4', name: 'Samuel Kapi', currentWorkload: 1, location: 'Mt Hagen', status: 'available' }
  ];

  const getWorkloadColor = (workload) => {
    if (workload <= 2) return 'text-success';
    if (workload <= 4) return 'text-warning';
    return 'text-error';
  };

  const handleAssign = () => {
    if (!selectedTechnician) return;
    
    onAssign?.({
      technicianId: selectedTechnician,
      notes: assignmentNotes
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Users" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Bulk Assignment</h2>
              <p className="text-sm text-muted-foreground">Assign {selectedTickets?.length} tickets to technician</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Selected Tickets Summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-2">Selected Tickets</h3>
            <div className="flex items-center gap-2">
              <Icon name="Ticket" size={16} className="text-primary" />
              <span className="text-sm text-foreground">{selectedTickets?.length} tickets selected for assignment</span>
            </div>
          </div>

          {/* Technician Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Technician
            </label>
            <Select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full"
            >
              <option value="">Choose a technician...</option>
              {technicians?.map(tech => (
                <option key={tech?.id} value={tech?.id}>
                  {tech?.name} - {tech?.location} ({tech?.currentWorkload} active tickets)
                </option>
              ))}
            </Select>
          </div>

          {/* Technician Workload Display */}
          {selectedTechnician && (
            <div className="grid grid-cols-2 gap-4">
              {technicians?.filter(t => t?.id === selectedTechnician)?.map(tech => (
                <React.Fragment key={tech?.id}>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="MapPin" size={16} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Location</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{tech?.location}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Activity" size={16} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Current Workload</span>
                    </div>
                    <p className={`text-sm font-semibold ${getWorkloadColor(tech?.currentWorkload)}`}>
                      {tech?.currentWorkload} active tickets
                    </p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Assignment Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Assignment Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Add any special instructions or notes for the technician..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              rows={4}
            />
          </div>

          {/* Workload Balancing Recommendation */}
          <div className="bg-info/10 border border-info/20 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={16} className="text-info mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-info mb-1">Workload Balancing</h4>
                <p className="text-xs text-info/80">
                  Consider distributing tickets among technicians with lower workloads for optimal efficiency
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            iconName="Check"
            iconPosition="left"
            onClick={handleAssign}
            disabled={!selectedTechnician}
          >
            Assign Tickets
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentModal;