import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const AdvancedFilterPanel = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const equipmentTypes = [
    { id: 'all', name: 'All Equipment' },
    { id: 'refrigerator', name: 'Vaccine Refrigerator' },
    { id: 'freezer', name: 'Freezer' },
    { id: 'coldroom', name: 'Cold Room' },
    { id: 'icr', name: 'Ice-Lined Refrigerator' }
  ];

  const faultCategories = [
    { id: 'all', name: 'All Categories' },
    { id: 'temperature', name: 'Temperature Control' },
    { id: 'power', name: 'Power Supply' },
    { id: 'mechanical', name: 'Mechanical' },
    { id: 'electrical', name: 'Electrical' }
  ];

  const priorities = [
    { id: 'all', name: 'All Priorities' },
    { id: 'high', name: 'High' },
    { id: 'medium', name: 'Medium' },
    { id: 'low', name: 'Low' }
  ];

  const statuses = [
    { id: 'all', name: 'All Statuses' },
    { id: 'new', name: 'New' },
    { id: 'assigned', name: 'Assigned' },
    { id: 'inprogress', name: 'In Progress' },
    { id: 'resolved', name: 'Resolved' },
    { id: 'escalated', name: 'Escalated' }
  ];

  const technicianAvailability = [
    { id: 'all', name: 'All Technicians' },
    { id: 'available', name: 'Available' },
    { id: 'busy', name: 'Busy' },
    { id: 'offline', name: 'Offline' }
  ];

  const escalationStatuses = [
    { id: 'all', name: 'All' },
    { id: 'escalated', name: 'Escalated Only' },
    { id: 'nonescalated', name: 'Non-Escalated' }
  ];

  const handleFilterChange = (field, value) => {
    onFilterChange?.({
      ...filters,
      [field]: value
    });
  };

  const handleResetFilters = () => {
    onFilterChange?.({
      equipmentType: 'all',
      faultCategory: 'all',
      priority: 'all',
      status: 'all',
      technicianAvailability: 'all',
      escalationStatus: 'all'
    });
  };

  return (
    <div className="w-80 border-r border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Filter" size={16} className="text-primary" />
          <h3 className="font-semibold text-foreground">Advanced Filters</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          iconName={isExpanded ? 'ChevronLeft' : 'ChevronRight'}
          onClick={() => setIsExpanded(!isExpanded)}
        />
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Equipment Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Equipment Type
            </label>
            <Select
              value={filters?.equipmentType || 'all'}
              onChange={(e) => handleFilterChange('equipmentType', e.target.value)}
              className="w-full"
            >
              {equipmentTypes?.map(type => (
                <option key={type?.id} value={type?.id}>
                  {type?.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Fault Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fault Category
            </label>
            <Select
              value={filters?.faultCategory || 'all'}
              onChange={(e) => handleFilterChange('faultCategory', e.target.value)}
              className="w-full"
            >
              {faultCategories?.map(category => (
                <option key={category?.id} value={category?.id}>
                  {category?.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Priority Level
            </label>
            <Select
              value={filters?.priority || 'all'}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full"
            >
              {priorities?.map(priority => (
                <option key={priority?.id} value={priority?.id}>
                  {priority?.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ticket Status
            </label>
            <Select
              value={filters?.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full"
            >
              {statuses?.map(status => (
                <option key={status?.id} value={status?.id}>
                  {status?.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Technician Availability */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Technician Availability
            </label>
            <Select
              value={filters?.technicianAvailability || 'all'}
              onChange={(e) => handleFilterChange('technicianAvailability', e.target.value)}
              className="w-full"
            >
              {technicianAvailability?.map(availability => (
                <option key={availability?.id} value={availability?.id}>
                  {availability?.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Escalation Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Escalation Status
            </label>
            <Select
              value={filters?.escalationStatus || 'all'}
              onChange={(e) => handleFilterChange('escalationStatus', e.target.value)}
              className="w-full"
            >
              {escalationStatuses?.map(escalation => (
                <option key={escalation?.id} value={escalation?.id}>
                  {escalation?.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              fullWidth
              iconName="RefreshCw"
              iconPosition="left"
              onClick={handleResetFilters}
            >
              Reset All Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilterPanel;