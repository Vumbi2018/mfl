import React, { useState } from 'react';
import { X, MapPin, Package, Clock, User, FileText, AlertTriangle, CheckCircle, MessageSquare, History } from 'lucide-react';
import { format } from 'date-fns';

const TicketDetailModal = ({ ticket, pngRegions, onClose, onUpdate, isOnline }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [updateData, setUpdateData] = useState({
    status: ticket?.status,
    assignedTo: ticket?.assignedTo || '',
    notes: '',
    resolution: ticket?.resolution || ''
  });

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-red-500',
      assigned: 'bg-orange-500',
      in_progress: 'bg-amber-500',
      escalated: 'bg-purple-500',
      resolved: 'bg-green-500',
      closed: 'bg-gray-500'
    };
    return colors?.[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50 border-red-200',
      medium: 'text-orange-600 bg-orange-50 border-orange-200',
      low: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    return colors?.[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const handleStatusUpdate = (newStatus) => {
    const updatedTicket = {
      ...ticket,
      status: newStatus,
      assignedTo: updateData?.assignedTo,
      lastUpdated: new Date()?.toISOString(),
      history: [
        ...ticket?.history,
        {
          action: newStatus,
          timestamp: new Date()?.toISOString(),
          user: 'Current User',
          details: updateData?.notes || `Status changed to ${newStatus}`
        }
      ]
    };

    if (newStatus === 'resolved') {
      updatedTicket.resolvedAt = new Date()?.toISOString();
      updatedTicket.resolution = updateData?.resolution;
    }

    onUpdate(updatedTicket);
  };

  const region = pngRegions?.[ticket?.region];
  const province = region?.provinces?.[ticket?.province];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">{ticket?.referenceNumber}</h2>
                <p className="text-blue-100 text-sm">Created {format(new Date(ticket.createdAt), 'PPp')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Status and Priority Badges */}
          <div className="flex items-center space-x-3 mt-4">
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-full px-3 py-1">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(ticket?.status)}`}></span>
              <span className="text-white text-sm font-medium">
                {ticket?.status?.split('_')?.map(word => word?.charAt(0)?.toUpperCase() + word?.slice(1))?.join(' ')}
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket?.priority)}`}>
              {ticket?.priority?.charAt(0)?.toUpperCase() + ticket?.priority?.slice(1)} Priority
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1 px-6">
            {['details', 'history', 'actions']?.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'details' && 'Details'}
                {tab === 'history' && 'History'}
                {tab === 'actions' && 'Actions'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Location Information */}
              <div>
                <div className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                  <MapPin className="w-5 h-5" />
                  <span>Location Information</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Region</p>
                      <p className="font-medium">{region?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Province</p>
                      <p className="font-medium">{province?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">District</p>
                      <p className="font-medium">{ticket?.district}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Facility</p>
                      <p className="font-medium">{ticket?.facility}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Information */}
              <div>
                <div className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                  <Package className="w-5 h-5" />
                  <span>Equipment Information</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Equipment</p>
                    <p className="font-medium">{ticket?.equipment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Equipment ID</p>
                    <p className="font-medium font-mono text-sm">{ticket?.equipmentId}</p>
                  </div>
                </div>
              </div>

              {/* Fault Description */}
              <div>
                <div className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Fault Description</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{ticket?.faultDescription}</p>
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <div className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                  <User className="w-5 h-5" />
                  <span>Assignment</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Created By</p>
                    <p className="font-medium">{ticket?.createdBy}</p>
                  </div>
                  {ticket?.assignedTo && (
                    <div>
                      <p className="text-xs text-gray-500">Assigned To</p>
                      <p className="font-medium">{ticket?.assignedTo}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="font-medium">{format(new Date(ticket.lastUpdated), 'PPp')}</p>
                  </div>
                </div>
              </div>

              {/* Resolution (if resolved) */}
              {ticket?.resolution && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Resolution</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700">{ticket?.resolution}</p>
                    {ticket?.resolvedAt && (
                      <p className="text-xs text-green-600 mt-2">
                        Resolved on {format(new Date(ticket.resolvedAt), 'PPp')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Parts Requested */}
              {ticket?.partsRequested && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-amber-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Parts Requested</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Spare parts have been requested for this repair
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-700 font-medium mb-4">
                <History className="w-5 h-5" />
                <span>Activity History</span>
              </div>
              
              <div className="relative">
                {ticket?.history?.map((entry, index) => (
                  <div key={index} className="flex space-x-4 pb-8">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entry?.action === 'created' ? 'bg-blue-100' :
                        entry?.action === 'assigned' ? 'bg-orange-100' :
                        entry?.action === 'started' || entry?.action === 'in_progress' ? 'bg-amber-100' :
                        entry?.action === 'resolved' ? 'bg-green-100' :
                        entry?.action === 'escalated'? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        {entry?.action === 'created' && <FileText className="w-5 h-5 text-blue-600" />}
                        {entry?.action === 'assigned' && <User className="w-5 h-5 text-orange-600" />}
                        {(entry?.action === 'started' || entry?.action === 'in_progress') && <Clock className="w-5 h-5 text-amber-600" />}
                        {entry?.action === 'resolved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {entry?.action === 'escalated' && <AlertTriangle className="w-5 h-5 text-purple-600" />}
                        {!['created', 'assigned', 'started', 'in_progress', 'resolved', 'escalated']?.includes(entry?.action) && 
                          <MessageSquare className="w-5 h-5 text-gray-600" />
                        }
                      </div>
                      {index < ticket?.history?.length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">
                            {entry?.action?.split('_')?.map(word => word?.charAt(0)?.toUpperCase() + word?.slice(1))?.join(' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(entry.timestamp), 'PPp')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{entry?.details}</p>
                        <p className="text-xs text-gray-500 mt-2">by {entry?.user}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              {!isOnline && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Offline Mode</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Actions will be saved locally and synced when you're back online
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  value={updateData?.status}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e?.target?.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <input
                  type="text"
                  value={updateData?.assignedTo}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, assignedTo: e?.target?.value }))}
                  placeholder="Enter technician name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={updateData?.notes}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e?.target?.value }))}
                  placeholder="Add notes about this update..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Resolution (if status is resolved) */}
              {updateData?.status === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={updateData?.resolution}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, resolution: e?.target?.value }))}
                    placeholder="Describe how the issue was resolved..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleStatusUpdate(updateData?.status)}
                  disabled={updateData?.status === 'resolved' && !updateData?.resolution}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Update Ticket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;