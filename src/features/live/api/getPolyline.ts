// src/features/live/api/getPolyline.ts

import { CacheManager } from "@core/cache/CacheManager";

import {
  getEuclideanDistance,
  calculateBearing,
  projectPointOnSegment
} from "@live/utils/geoUtils";
import { GeoPolylineData } from "@live/models/data";

const polylineCache = new CacheManager<GeoPolylineData>();

/**
 * Fetch {routeName}.geojson file and cache the result.
 *
 * @param routeName - routeName (ex: "30", "100", "200")
 * @returns {Promise<GeoPolylineData>} - GeoJSON Data
 * @throws {Error} - If the fetch fails or the response is not ok
 */
export async function getPolyline(routeName: string): Promise<GeoPolylineData> {
  return polylineCache.getOrFetch(routeName, async () => {
    const res = await fetch(`/data/polylines/${routeName}.geojson`);
    if (!res.ok) {
      throw new Error(`🚫 Polyline request failed: ${routeName}`);
    }
    return res.json() as Promise<GeoPolylineData>;
  });
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
 * Removes duplicate consecutive points for efficiency.
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
    const d = getEuclideanDistance(P, projection);
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
