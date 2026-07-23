import React from 'react';
import Icon from '../../../components/AppIcon';
import { calculateHaversineDistance, calculateTravelTimes, findNearestCapitals } from '../../../utils/distanceCalculator';

const CapitalDistanceCard = ({ selectedFacility, capitals = [], districtRoute, provincialRoute, nationalRoute, onClose, onFlyToCoordinates, isEmbedded }) => {
  if (!selectedFacility || !selectedFacility.lat || !selectedFacility.lng) return null;

  const { nearestDistrictHQ, nearestProvincialHQ } = findNearestCapitals(
    selectedFacility.lat,
    selectedFacility.lng,
    capitals,
    selectedFacility.province,
    selectedFacility.district
  );

  const districtTravelTimes = districtRoute?.distance 
    ? calculateTravelTimes(nearestDistrictHQ.distanceKm, districtRoute.distance / 1000)
    : nearestDistrictHQ?.travelTimes;

  const provincialTravelTimes = provincialRoute?.distance 
    ? calculateTravelTimes(nearestProvincialHQ.distanceKm, provincialRoute.distance / 1000)
    : nearestProvincialHQ?.travelTimes;

  const LUSAKA_COORDS = { lat: -15.4167, lng: 28.2833 };
  const nationalDistanceKm = calculateHaversineDistance(selectedFacility.lat, selectedFacility.lng, LUSAKA_COORDS.lat, LUSAKA_COORDS.lng);
  
  const nationalTravelTimes = nationalRoute?.distance
    ? calculateTravelTimes(nationalDistanceKm, nationalRoute.distance / 1000)
    : calculateTravelTimes(nationalDistanceKm);

  const containerClasses = isEmbedded 
    ? "space-y-4 w-full"
    : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-2xl space-y-4 max-w-sm w-full animate-in slide-in-from-right duration-200";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Icon name="Navigation" size={18} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Distance & Travel Analysis</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate max-w-[200px]">{selectedFacility.name}</p>
          </div>
        </div>
        {!isEmbedded && (
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-all"
          >
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      {/* District Headquarters Distance Card */}
      {nearestDistrictHQ ? (
        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                District HQ: {nearestDistrictHQ.district}
              </span>
            </div>
            <button
              onClick={() => onFlyToCoordinates([nearestDistrictHQ.latitude, nearestDistrictHQ.longitude], 13)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View HQ</span>
              <Icon name="ExternalLink" size={12} />
            </button>
          </div>

          {/* Distances */}
          <div className="grid grid-cols-2 gap-2 text-center bg-white dark:bg-gray-800/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Direct Line</span>
              <span className="text-sm font-extrabold text-indigo-900 dark:text-indigo-100">{nearestDistrictHQ.distanceKm} km</span>
            </div>
            <div className="border-l border-slate-100 dark:border-gray-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Real Road</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-300">
                {districtRoute?.distance ? `${(districtRoute.distance / 1000).toFixed(1)} km` : `${nearestDistrictHQ.travelTimes.estimatedRoadKm} km`}
              </span>
            </div>
          </div>

          {/* Travel Times Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
              <span className="text-base">🚗</span>
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block truncate">Vehicle</span>
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{districtTravelTimes.vehicle.formatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
              <span className="text-base">🏍️</span>
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block truncate">Motorcycle</span>
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{districtTravelTimes.motorcycle.formatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
              <span className="text-base">🚴</span>
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block truncate">Bicycle</span>
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{districtTravelTimes.bicycle.formatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
              <span className="text-base">🚶</span>
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block truncate">Walking</span>
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{districtTravelTimes.walking.formatted}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Provincial Headquarters Distance Card */}
      {nearestProvincialHQ ? (
        <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                Provincial HQ: {nearestProvincialHQ.district} ({nearestProvincialHQ.province})
              </span>
            </div>
            <button
              onClick={() => onFlyToCoordinates([nearestProvincialHQ.latitude, nearestProvincialHQ.longitude], 13)}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>View HQ</span>
              <Icon name="ExternalLink" size={12} />
            </button>
          </div>

          {/* Distances */}
          <div className="grid grid-cols-2 gap-2 text-center bg-white dark:bg-gray-800/80 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Direct Line</span>
              <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100">{nearestProvincialHQ.distanceKm} km</span>
            </div>
            <div className="border-l border-slate-100 dark:border-gray-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Real Road</span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-300">
                {provincialRoute?.distance ? `${(provincialRoute.distance / 1000).toFixed(1)} km` : `${nearestProvincialHQ.travelTimes.estimatedRoadKm} km`}
              </span>
            </div>
          </div>

          {/* Travel Times Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
              <span className="text-base">🚗</span>
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block truncate">Vehicle</span>
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{provincialTravelTimes.vehicle.formatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
              <span className="text-base">🏍️</span>
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block truncate">Motorcycle</span>
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{provincialTravelTimes.motorcycle.formatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
              <span className="text-base">🚴</span>
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block truncate">Bicycle</span>
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{provincialTravelTimes.bicycle.formatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
              <span className="text-base">🚶</span>
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block truncate">Walking</span>
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{provincialTravelTimes.walking.formatted}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* National Capital Distance Card */}
      <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
              National Capital: Lusaka
            </span>
          </div>
          <button
            onClick={() => onFlyToCoordinates([LUSAKA_COORDS.lat, LUSAKA_COORDS.lng], 12)}
            className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>View Capital</span>
            <Icon name="ExternalLink" size={12} />
          </button>
        </div>

        {/* Distances */}
        <div className="grid grid-cols-2 gap-2 text-center bg-white dark:bg-gray-800/80 p-2 rounded-lg border border-purple-100 dark:border-purple-900/30">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Direct Line</span>
            <span className="text-sm font-extrabold text-purple-900 dark:text-purple-100">{nationalDistanceKm.toFixed(1)} km</span>
          </div>
          <div className="border-l border-slate-100 dark:border-gray-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Real Road</span>
            <span className="text-sm font-extrabold text-purple-600 dark:text-purple-300">
              {nationalRoute?.distance ? `${(nationalRoute.distance / 1000).toFixed(1)} km` : `${nationalTravelTimes.estimatedRoadKm} km`}
            </span>
          </div>
        </div>

        {/* Travel Times Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
            <span className="text-base">🚗</span>
            <div className="text-left min-w-0">
              <span className="text-[10px] text-slate-400 font-semibold block truncate">Vehicle</span>
              <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{nationalTravelTimes.vehicle.formatted}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
            <span className="text-base">🏍️</span>
            <div className="text-left min-w-0">
              <span className="text-[10px] text-slate-400 font-semibold block truncate">Motorcycle</span>
              <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{nationalTravelTimes.motorcycle.formatted}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
            <span className="text-base">🚴</span>
            <div className="text-left min-w-0">
              <span className="text-[10px] text-slate-400 font-semibold block truncate">Bicycle</span>
              <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{nationalTravelTimes.bicycle.formatted}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800/60 rounded-lg border border-slate-100 dark:border-gray-700">
            <span className="text-base">🚶</span>
            <div className="text-left min-w-0">
              <span className="text-[10px] text-slate-400 font-semibold block truncate">Walking</span>
              <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{nationalTravelTimes.walking.formatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* External Map Directions Button */}
      {nearestDistrictHQ && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${selectedFacility.lat},${selectedFacility.lng}&destination=${nearestDistrictHQ.latitude},${nearestDistrictHQ.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2"
        >
          <Icon name="Navigation" size={14} />
          <span>Open Google Maps Driving Route</span>
        </a>
      )}
    </div>
  );
};

export default CapitalDistanceCard;
