import React from 'react';
import Icon from '../../../components/AppIcon';


const TicketStatusCard = ({ title, count, icon: Icon, color, onClick }) => {
  const colorClasses = {
    red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses?.[color]} border rounded-lg p-4 transition-all transform hover:scale-105 w-full text-left`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <p className="text-sm font-medium">{title}</p>
    </button>
  );
};

export default TicketStatusCard;