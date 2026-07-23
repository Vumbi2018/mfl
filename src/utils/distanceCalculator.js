/**
 * Haversine formula to calculate straight-line distance between two GPS coordinates in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 2 decimal places
}

/**
 * Applies average road network tortuosity factor (1.30x) to convert straight-line to estimated road distance
 */
export function estimateRoadDistance(straightLineKm) {
  if (!straightLineKm || isNaN(straightLineKm)) return 0;
  return Math.round(straightLineKm * 1.3 * 10) / 10;
}

/**
 * Format minutes/hours into readable text (e.g. "45 min" or "2h 15m")
 */
export function formatDuration(hoursDecimal) {
  if (!hoursDecimal || hoursDecimal <= 0) return '0 min';
  const totalMinutes = Math.round(hoursDecimal * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Calculates estimated travel times across 4 common transport modes in Zambia
 */
export function calculateTravelTimes(straightLineKm, realRoadKm = null) {
  const roadKm = realRoadKm !== null ? realRoadKm : estimateRoadDistance(straightLineKm);
  
  // Speeds in km/h
  const SPEEDS = {
    vehicle: 60,     // Ambulance / Car / Bus on paved & feeder roads
    motorcycle: 40,  // Motorbike on rural trails & unpaved roads
    bicycle: 12,     // Bicycle on rural roads
    walking: 5       // Walking on foot
  };

  const vehicleHours = roadKm / SPEEDS.vehicle;
  const motorcycleHours = roadKm / SPEEDS.motorcycle;
  const bicycleHours = roadKm / SPEEDS.bicycle;
  const walkingHours = roadKm / SPEEDS.walking;

  return {
    straightLineKm,
    estimatedRoadKm: roadKm,
    vehicle: {
      hours: vehicleHours,
      formatted: formatDuration(vehicleHours),
      label: 'Vehicle / Ambulance',
      speed: '60 km/h avg'
    },
    motorcycle: {
      hours: motorcycleHours,
      formatted: formatDuration(motorcycleHours),
      label: 'Motorcycle',
      speed: '40 km/h avg'
    },
    bicycle: {
      hours: bicycleHours,
      formatted: formatDuration(bicycleHours),
      label: 'Bicycle',
      speed: '12 km/h avg'
    },
    walking: {
      hours: walkingHours,
      formatted: formatDuration(walkingHours),
      label: 'Foot / Walking',
      speed: '5 km/h avg'
    }
  };
}

/**
 * Finds the nearest District HQ and Provincial HQ for any given facility coordinates
 */
export function findNearestCapitals(facilityLat, facilityLng, capitals = [], facilityProvince = '', facilityDistrict = '') {
  if (!facilityLat || !facilityLng || !capitals || capitals.length === 0) {
    return { nearestDistrictHQ: null, nearestProvincialHQ: null };
  }

  const lat1 = parseFloat(facilityLat);
  const lng1 = parseFloat(facilityLng);

  let nearestDistrictHQ = null;
  let minDistrictDist = Infinity;

  let nearestProvincialHQ = null;
  let minProvincialDist = Infinity;

  capitals.forEach(cap => {
    const lat2 = parseFloat(cap.latitude);
    const lng2 = parseFloat(cap.longitude);
    if (isNaN(lat2) || isNaN(lng2)) return;

    const dist = calculateHaversineDistance(lat1, lng1, lat2, lng2);

    // District HQ check (prioritize same district or closest)
    const isSameDistrict = facilityDistrict && cap.district.toLowerCase() === facilityDistrict.toLowerCase();
    if (isSameDistrict) {
      if (!nearestDistrictHQ || dist < minDistrictDist) {
        minDistrictDist = dist;
        nearestDistrictHQ = { ...cap, distanceKm: dist, travelTimes: calculateTravelTimes(dist) };
      }
    } else if (!nearestDistrictHQ && dist < minDistrictDist) {
      minDistrictDist = dist;
      nearestDistrictHQ = { ...cap, distanceKm: dist, travelTimes: calculateTravelTimes(dist) };
    }

    // Provincial HQ check
    if (cap.is_provincial_hq) {
      const isSameProvince = facilityProvince && cap.province.toLowerCase() === facilityProvince.toLowerCase();
      if (isSameProvince) {
        if (!nearestProvincialHQ || dist < minProvincialDist) {
          minProvincialDist = dist;
          nearestProvincialHQ = { ...cap, distanceKm: dist, travelTimes: calculateTravelTimes(dist) };
        }
      } else if (!nearestProvincialHQ && dist < minProvincialDist) {
        minProvincialDist = dist;
        nearestProvincialHQ = { ...cap, distanceKm: dist, travelTimes: calculateTravelTimes(dist) };
      }
    }
  });

  // Fallback if no exact match found
  if (!nearestDistrictHQ && capitals.length > 0) {
    capitals.forEach(cap => {
      const dist = calculateHaversineDistance(lat1, lng1, parseFloat(cap.latitude), parseFloat(cap.longitude));
      if (dist < minDistrictDist) {
        minDistrictDist = dist;
        nearestDistrictHQ = { ...cap, distanceKm: dist, travelTimes: calculateTravelTimes(dist) };
      }
    });
  }

  if (!nearestProvincialHQ) {
    const provCapitals = capitals.filter(c => c.is_provincial_hq);
    provCapitals.forEach(cap => {
      const dist = calculateHaversineDistance(lat1, lng1, parseFloat(cap.latitude), parseFloat(cap.longitude));
      if (dist < minProvincialDist) {
        minProvincialDist = dist;
        nearestProvincialHQ = { ...cap, distanceKm: dist, travelTimes: calculateTravelTimes(dist) };
      }
    });
  }

  return { nearestDistrictHQ, nearestProvincialHQ };
}
