import React from 'react';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';

const TechnicianMapView = ({ tickets, technicianLocation, onTicketSelect }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-orange-500',
      low: 'bg-blue-500'
    };
    return colors?.[priority] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Map Placeholder - In production, integrate with Google Maps or Mapbox */}
      <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Map View</h3>
            <p className="text-gray-600 mb-4">
              In production, this would show an interactive map with ticket locations
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Navigation className="w-4 h-4" />
              <span>Your location: Lae, Morobe Province</span>
            </div>
          </div>
        </div>

        {/* Mock markers visualization */}
        <div className="absolute inset-0 pointer-events-none">
          {tickets?.map((ticket, index) => (
            <div
              key={ticket?.id}
              className="absolute"
              style={{
                left: `${20 + index * 15}%`,
                top: `${30 + index * 10}%`
              }}
            >
              <div className={`w-8 h-8 ${getPriorityColor(ticket?.priority)} rounded-full border-4 border-white shadow-lg flex items-center justify-center pointer-events-auto cursor-pointer hover:scale-110 transition-transform`}>
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
            </div>
          ))}
          
          {/* Technician location marker */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
              <Navigation className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      {/* Ticket List Below Map */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Nearby Tickets</h4>
        <div className="space-y-2">
          {tickets?.slice(0, 3)?.map((ticket, index) => (
            <button
              key={ticket?.id}
              onClick={() => onTicketSelect(ticket)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${getPriorityColor(ticket?.priority)} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{ticket?.facility}</p>
                  <p className="text-sm text-gray-600">{ticket?.distance} away</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {ticket?.priority === 'high' && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechnicianMapView;