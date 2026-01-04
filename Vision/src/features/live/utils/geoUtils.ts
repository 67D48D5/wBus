// src/features/live/utils/geoUtils.ts

/**
 * Geographic utility functions for distance and bearing calculations
 */

/**
 * Calculate Haversine distance between two geographical points.
 * This is the proper way to calculate distance on a sphere (Earth).
 *
 * @param lat1 First point's latitude
 * @param lon1 First point's longitude
 * @param lat2 Second point's latitude
 * @param lon2 Second point's longitude
 * @returns Distance in kilometers
 */
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate Euclidean distance between two points.
 * Use this for small distances where spherical calculations aren't necessary.
 * Coordinates are in [lat, lng] format.
 *
 * @param P First point
 * @param Q Second point
 * @returns Euclidean distance
 */
export function getEuclideanDistance(
  P: [number, number],
  Q: [number, number]
): number {
  const dx = P[0] - Q[0];
  const dy = P[1] - Q[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the bearing (direction) between two points A and B.
 * Returns angle in degrees (0-360).
 * Coordinates are in [lat, lng] format.
 *
 * @param A Start point [lat, lng]
 * @param B End point [lat, lng]
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  A: [number, number],
  B: [number, number]
): number {
  const [lat1, lon1] = A.map((d) => (d * Math.PI) / 180);
  const [lat2, lon2] = B.map((d) => (d * Math.PI) / 180);
  const dLon = lon2 - lon1;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Calculate the angle (rotation) between two coordinates A and B.
 * Returns angle in degrees for use in rotation transformations.
 * Coordinates are in [lat, lng] format.
 *
 * @param A Start point [lat, lng]
 * @param B End point [lat, lng]
 * @returns Angle in degrees
 */
export function calculateAngle(
  A: [number, number],
  B: [number, number]
): number {
  const deltaLat = B[0] - A[0];
  const deltaLng = B[1] - A[1];
  return (Math.atan2(deltaLat, deltaLng) * 180) / Math.PI;
}

/**
 * Project a point P onto a line segment AB.
 * Returns the closest point on the segment to P.
 *
 * @param P Point to project
 * @param A Line segment start point
 * @param B Line segment end point
 * @returns Projected point on line segment AB
 */
export function projectPointOnSegment(
  P: [number, number],
  A: [number, number],
  B: [number, number]
): [number, number] {
  const AP = [P[0] - A[0], P[1] - A[1]];
  const AB = [B[0] - A[0], B[1] - A[1]];
  const ab2 = AB[0] * AB[0] + AB[1] * AB[1];

  // Handle case where A and B are the same point
  if (ab2 === 0) {
    return A;
  }

  const dot = AP[0] * AB[0] + AP[1] * AB[1];
  let t = dot / ab2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  return [A[0] + AB[0] * t, A[1] + AB[1] * t];
}
