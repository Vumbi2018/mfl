import React, { useState } from 'react';
import { MapPin, Package, Clock, Navigation, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const TechnicianTicketCard = ({ ticket, onUpdate, isOnline }) => {
  const [showActions, setShowActions] = useState(false);
  const [notes, setNotes] = useState('');

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-orange-500 bg-orange-50',
      low: 'border-blue-500 bg-blue-50'
    };
    return colors?.[priority] || 'border-gray-500 bg-gray-50';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-orange-100 text-orange-700 border-orange-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return badges?.[priority] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleStartWork = () => {
    onUpdate(ticket?.id, {
      status: 'in_progress',
      startedAt: new Date()?.toISOString()
    });
    setShowActions(false);
  };

  const handleResolve = () => {
    if (!notes) {
      alert('Please add resolution notes');
      return;
    }
    onUpdate(ticket?.id, {
      status: 'resolved',
      resolvedAt: new Date()?.toISOString(),
      resolution: notes
    });
    setShowActions(false);
    setNotes('');
  };

  const handleRequestParts = () => {
    onUpdate(ticket?.id, {
      partsRequested: true
    });
    alert('Parts request submitted');
  };

  const openNavigation = () => {
    if (ticket?.facilityLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${ticket?.facilityLocation?.lat},${ticket?.facilityLocation?.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(ticket?.priority)} overflow-hidden`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-mono text-gray-600">{ticket?.referenceNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(ticket?.priority)}`}>
                {ticket?.priority?.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{ticket?.facility}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              {ticket?.distance} • {ticket?.estimatedTime}
            </div>
          </div>
          <button
            onClick={openNavigation}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">Navigate</span>
          </button>
        </div>

        {/* Equipment Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <Package className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{ticket?.equipment}</p>
              <p className="text-sm text-gray-600 font-mono">{ticket?.equipmentId}</p>
              <p className="text-sm text-gray-700 mt-2">{ticket?.faultDescription}</p>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Assigned {format(new Date(ticket.assignedAt), 'PP')}</span>
          </div>
          {ticket?.startedAt && (
            <div className="flex items-center text-amber-600">
              <Play className="w-4 h-4 mr-1" />
              <span>Started {format(new Date(ticket.startedAt), 'pp')}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {ticket?.status === 'assigned' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleStartWork}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start Work</span>
            </button>
            <button
              onClick={handleRequestParts}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Package className="w-4 h-4" />
            </button>
          </div>
        )}

        {ticket?.status === 'in_progress' && (
          <>
            {!showActions ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowActions(true)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Resolved</span>
                </button>
                <button
                  onClick={handleRequestParts}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Package className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e?.target?.value)}
                  placeholder="Describe what was done to resolve the issue..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleResolve}
                    disabled={!notes}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Submit Resolution
                  </button>
                  <button
                    onClick={() => {
                      setShowActions(false);
                      setNotes('');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {ticket?.status === 'resolved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
              <div>
                <p className="font-medium text-green-900">Resolved</p>
                <p className="text-sm text-green-700 mt-1">{ticket?.resolution}</p>
                <p className="text-xs text-green-600 mt-2">
                  {format(new Date(ticket.resolvedAt), 'PPp')}
                </p>
              </div>
            </div>
          </div>
        )}

        {ticket?.partsRequested && (
          <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 mr-2" />
              <p className="text-sm text-amber-800">Spare parts requested</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianTicketCard;