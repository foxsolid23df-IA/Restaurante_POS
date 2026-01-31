/**
 * Utility for Route Optimization using Distance Matrix Logic
 */

/**
 * Calculates the Haversine distance between two points on the globe.
 * Useful as a fallback when API is not available.
 */
export const calculateHaversineDistance = (p1, p2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Basic Nearest Neighbor Algorithm (Traveling Salesman Problem greedy approach)
 * @param {Object} startPoint {lat, lng} - Restaurant location
 * @param {Array} points - Array of delivery objects with {id, lat, lng}
 */
export const optimizeDeliveryRoute = (startPoint, points) => {
  if (points.length <= 1) return points;

  let unvisited = [...points];
  let currentPos = startPoint;
  let optimizedPath = [];

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = calculateHaversineDistance(currentPos, unvisited[0]);

    for (let i = 1; i < unvisited.length; i++) {
      const dist = calculateHaversineDistance(currentPos, unvisited[i]);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    currentPos = unvisited[nearestIdx];
    optimizedPath.push(unvisited[nearestIdx]);
    unvisited.splice(nearestIdx, 1);
  }

  return optimizedPath;
};

/**
 * Group deliveries into clusters based on distance
 * Useful for assigning multiple orders to a single driver
 */
export const clusterDeliveries = (points, maxRadiusKm = 3) => {
  const clusters = [];
  const processed = new Set();

  points.forEach((p, idx) => {
    if (processed.has(p.id)) return;

    const currentCluster = [p];
    processed.add(p.id);

    points.forEach((other) => {
      if (processed.has(other.id)) return;
      const dist = calculateHaversineDistance(p, other);
      if (dist <= maxRadiusKm) {
        currentCluster.push(other);
        processed.add(other.id);
      }
    });

    clusters.push(currentCluster);
  });

  return clusters;
};
