// src/features/bus/utils/geoUtils.ts

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type Coordinate = [number, number]; // [Latitude, Longitude]

// ----------------------------------------------------------------------
// Distance Calculations
// ----------------------------------------------------------------------

/**
 * Calculates the Great Circle (Haversine) distance between two geographic points.
 * Use this for accurate long-distance measurements on Earth.
 * 
 *
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates the Euclidean distance between two points (Planar approximation).
 * Faster than Haversine, suitable for very short distances or relative comparisons.
 *
 * @param P First point [lat, lng]
 * @param Q Second point [lat, lng]
 * @returns The straight-line distance in coordinate units
 */
export function getEuclideanDistance(P: Coordinate, Q: Coordinate): number {
  const dx = P[0] - Q[0];
  const dy = P[1] - Q[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// ----------------------------------------------------------------------
// Direction & Projection
// ----------------------------------------------------------------------

/**
 * Calculates the initial bearing (forward azimuth) from point A to point B.
 * Returns the angle in degrees (0-360), where 0 is North, 90 is East.
 *
 * @param A Start point [lat, lng]
 * @param B End point [lat, lng]
 * @returns Bearing in degrees (0° to 360°)
 */
export function calculateBearing(A: Coordinate, B: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(A[0]);
  const lat2 = toRad(B[0]);
  const dLon = toRad(B[1] - A[1]);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculates the standard Cartesian angle between two points.
 * Note: This returns a math angle (Counter-clockwise from positive X-axis),
 * not necessarily a geographic map bearing.
 *
 * @param A Start point [lat, lng]
 * @param B End point [lat, lng]
 * @returns Angle in degrees
 */
export function calculateAngle(A: Coordinate, B: Coordinate): number {
  const deltaLat = B[0] - A[0];
  const deltaLng = B[1] - A[1];
  // atan2(y, x) -> result in radians
  return (Math.atan2(deltaLat, deltaLng) * 180) / Math.PI;
}

/**
 * Projects a point P onto the nearest location on the line segment AB.
 * 
 * Used for snapping GPS points to a road geometry.
 *
 * @param P The point to project [lat, lng]
 * @param A Segment start [lat, lng]
 * @param B Segment end [lat, lng]
 * @returns The closest point on the segment [lat, lng]
 */
export function projectPointOnSegment(
  P: Coordinate,
  A: Coordinate,
  B: Coordinate
): Coordinate {
  const AP = [P[0] - A[0], P[1] - A[1]];
  const AB = [B[0] - A[0], B[1] - A[1]];

  const abSquared = AB[0] * AB[0] + AB[1] * AB[1];

  // If segment length is 0 (A and B are same), return A
  if (abSquared === 0) {
    return A;
  }

  // Project AP onto AB (dot product)
  const dot = AP[0] * AB[0] + AP[1] * AB[1];

  // Calculate normalized distance 't' along the segment
  let t = dot / abSquared;

  // Clamp t to the segment [0, 1] to ensure we stay within the segment
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  return [A[0] + AB[0] * t, A[1] + AB[1] * t];
}
