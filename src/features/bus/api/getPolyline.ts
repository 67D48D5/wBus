// src/features/bus/api/getPolyline.ts

import { GeoPolylineData } from "@bus/types/data";

// For caching GeoJSON data
// Key: routeName, Value: GeoJSON data
// Example: { "30": { type: "FeatureCollection", features: [...] } }
const cache: Record<string, GeoPolylineData> = {};
const pending: Record<string, Promise<GeoPolylineData>> = {};

/**
 * Fetch {routeName}.geojson file and cache the result.
 *
 * @param routeName - routeName (ex: "30", "100", "200")
 * @returns {Promise<GeoPolylineData>} - GeoJSON Data
 * @throws {Error} - If the fetch fails or the response is not ok
 */
export async function getPolyline(routeName: string): Promise<GeoPolylineData> {
  // If already cached, return cached data
  if (cache[routeName]) return cache[routeName];

  // If a request is already pending, return the pending promise
  if (await pending[routeName]) return pending[routeName];

  // Start a new fetch request
  pending[routeName] = fetch(`/data/polylines/${routeName}.geojson`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`🚫 Polyline request failed: ${routeName}`);
      }
      return res.json();
    })
    .then((json: GeoPolylineData) => {
      cache[routeName] = json;
      return json;
    })
    .finally(() => {
      delete pending[routeName];
    });

  return pending[routeName];
}

/**
 * Transform GeoJSON data into separate polylines for up and down directions.
 *
 * @param data - GeoJSON data containing features with coordinates and properties
 * @returns {{ upPolyline: [number, number][][], downPolyline: [number, number][][] }}
 */
export function transformPolyline(data: GeoPolylineData) {
  const upPolyline: [number, number][][] = [];
  const downPolyline: [number, number][][] = [];

  data.features.forEach((feature) => {
    const coords = feature.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );
    if (feature.properties.updnDir === "1") upPolyline.push(coords);
    else if (feature.properties.updnDir === "0") downPolyline.push(coords);
  });

  return { upPolyline, downPolyline };
}

/**
 * Merge multiple polylines into a single polyline.
 *
 * @param polylines - Target polylines to merge
 *                    (each polyline is an array of [lat, lng] pairs)
 * @returns - Merged polyline as an array of [lat, lng] pairs
 */
export function mergePolylines(
  polylines: [number, number][][]
): [number, number][] {
  return polylines
    .flat()
    .reduce<[number, number][]>((merged, point, index, arr) => {
      if (
        index === 0 ||
        point[0] !== arr[index - 1][0] ||
        point[1] !== arr[index - 1][1]
      ) {
        merged.push(point);
      }
      return merged;
    }, []);
}

/**
 * Calculate the bearing (direction) between two points A and B.
 * (Coordinates are in [lat, lng] format)
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
 * When given a point P and a line segment AB,
 * this function projects point P onto the line segment AB.
 *
 * @param P - The point to project
 * @param A - The start point of the line segment
 * @param B - The end point of the line segment
 * @returns - The projected point on the line segment AB
 *            (returns the closest point on the segment to P)
 */
function projectPointOnSegment(
  P: [number, number],
  A: [number, number],
  B: [number, number]
): [number, number] {
  const AP = [P[0] - A[0], P[1] - A[1]];
  const AB = [B[0] - A[0], B[1] - A[1]];
  const ab2 = AB[0] * AB[0] + AB[1] * AB[1];
  const dot = AP[0] * AB[0] + AP[1] * AB[1];
  let t = dot / ab2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  return [A[0] + AB[0] * t, A[1] + AB[1] * t];
}

/**
 * Calculate the distance between two points P and Q.
 * Coordinates are in [lat, lng] format.
 *
 * @param P - The first point
 * @param Q - The second point
 * @returns - The Euclidean distance between P and Q
 *            (not considering the curvature of the Earth)
 */
function distance(P: [number, number], Q: [number, number]): number {
  const dx = P[0] - Q[0];
  const dy = P[1] - Q[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the angle (rotation) between two coordinates A and B.
 * Coordinates are in [lat, lng] format.
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
 * Snap a point P to the nearest segment of a polyline.
 * Returns the closest point on the polyline, the angle of the segment,
 * and the segment itself.
 */
export function snapToPolyline(
  P: [number, number],
  polyline: [number, number][]
): {
  position: [number, number];
  angle: number;
  segment: { A: [number, number]; B: [number, number] };
} {
  if (polyline.length < 2)
    return {
      position: polyline[0],
      angle: 0,
      segment: { A: polyline[0], B: polyline[0] },
    };

  let bestDist = Infinity;
  let bestPosition: [number, number] = polyline[0];
  let bestSegment = { A: polyline[0], B: polyline[1] };

  for (let i = 0; i < polyline.length - 1; i++) {
    const A = polyline[i];
    const B = polyline[i + 1];
    const projection = projectPointOnSegment(P, A, B);
    const d = distance(P, projection);
    if (d < bestDist) {
      bestDist = d;
      bestPosition = projection;
      bestSegment = { A, B };
    }
  }

  const angle = calculateBearing(bestSegment.A, bestSegment.B);

  return {
    position: bestPosition,
    angle,
    segment: bestSegment,
  };
}
