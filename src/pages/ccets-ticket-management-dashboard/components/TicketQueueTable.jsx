import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const TicketQueueTable = ({
  tickets,
  selectedTickets,
  onTicketSelect,
  onSelectionChange,
  onStatusUpdate,
  filters,
  selectedLocation
}) => {
  const [sortField, setSortField] = useState('slaTimer');
  const [sortDirection, setSortDirection] = useState('asc');

  const getSLAColorClass = (slaStatus) => {
    switch (slaStatus) {
      case 'critical': return 'bg-error/10 text-error border-error/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-success/10 text-success border-success/20';
    }
  };

  const getPriorityColorClass = (priority) => {
    switch (priority) {
      case 'High': return 'bg-error/10 text-error';
      case 'Medium': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'New': return 'bg-primary/10 text-primary';
      case 'Assigned': return 'bg-info/10 text-info';
      case 'In Progress': return 'bg-warning/10 text-warning';
      case 'Resolved': return 'bg-success/10 text-success';
      case 'Escalated': return 'bg-error/10 text-error';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange?.(tickets?.map(t => t?.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectTicket = (ticketId, checked) => {
    if (checked) {
      onSelectionChange?.([...selectedTickets, ticketId]);
    } else {
      onSelectionChange?.(selectedTickets?.filter(id => id !== ticketId));
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-card rounded-lg border border-border">
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={selectedTickets?.length === tickets?.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                onClick={() => handleSort('referenceNumber')}
              >
                <div className="flex items-center gap-1">
                  Reference
                  <Icon name="ArrowUpDown" size={12} />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Facility / Equipment
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Fault Description
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Priority
                  <Icon name="ArrowUpDown" size={12} />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Status
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                onClick={() => handleSort('slaTimer')}
              >
                <div className="flex items-center gap-1">
                  SLA Timer
                  <Icon name="ArrowUpDown" size={12} />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Technician
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets?.map(ticket => (
              <tr
                key={ticket?.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onTicketSelect?.(ticket)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedTickets?.includes(ticket?.id)}
                    onChange={(e) => handleSelectTicket(ticket?.id, e.target.checked)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-mono text-foreground">{ticket?.referenceNumber}</span>
                    <span className="text-xs text-muted-foreground">{ticket?.createdDate}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{ticket?.facility}</span>
                    <span className="text-xs text-muted-foreground">{ticket?.equipment}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-foreground line-clamp-2 max-w-xs">
                    {ticket?.faultDescription}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColorClass(ticket?.priority)}`}>
                    {ticket?.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(ticket?.status)}`}>
                    {ticket?.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getSLAColorClass(ticket?.slaStatus)}`}>
                    {ticket?.slaTimer}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {ticket?.assignedTechnician ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon name="User" size={16} className="text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{ticket?.assignedTechnician}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      iconName="Eye"
                      onClick={() => onTicketSelect?.(ticket)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      iconName="Edit"
                      onClick={() => console.log('Edit ticket', ticket?.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {tickets?.length} of {tickets?.length} tickets
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketQueueTable;