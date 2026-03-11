/**
 * Route helper utilities for emergency response routing
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Get intermediate points between two coordinates for route approximation
 */
export const getRoutePoints = (
  start: Coordinate,
  end: Coordinate,
  numPoints: number = 10
): Coordinate[] => {
  const points: Coordinate[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    points.push({
      lat: start.lat + (end.lat - start.lat) * fraction,
      lng: start.lng + (end.lng - start.lng) * fraction,
    });
  }
  return points;
};

/**
 * Check if a point is near a route (within buffer distance in km)
 */
export const isNearRoute = (
  point: Coordinate,
  routeStart: Coordinate,
  routeEnd: Coordinate,
  bufferKm: number = 2
): boolean => {
  const { calculateDistance } = require('./distanceCalculator');
  const routePoints = getRoutePoints(routeStart, routeEnd, 20);

  for (const routePoint of routePoints) {
    const distance = calculateDistance(point.lat, point.lng, routePoint.lat, routePoint.lng);
    if (distance <= bufferKm) {
      return true;
    }
  }

  return false;
};
