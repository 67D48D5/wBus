// src/features/bus/utils/polyUtils.ts

import {
    calculateBearing,
    projectPointOnSegment
} from "@map/utils/geoUtils";

import type { GeoPolyline } from "@core/domain/polyline";

/**
* Helper: Calculate squared Euclidean distance (Faster than sqrt)
* For performance optimization in snapToPolyline function.
*/
function getSqDist(p1: [number, number], p2: [number, number]): number {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
}

/**
* Transform GeoJSON data into separate polylines for up and down directions.
* [Important] Data may not come in order, so sorting by start_node_ord is necessary.
* 
* New schema (single Feature with is_turning_point):
* - One Feature contains the entire route (up + down in single LineString)
* - is_turning_point: true indicates this is a round-trip route
* - The turning point is found by detecting where the bus turns back (farthest point from start)
*
* Logic:
* 1) If multiple features with both direction 0 and 1 exist, split by direction.
* 2) If single feature with is_turning_point, find the turning point and split there.
*/
export function transformPolyline(data: GeoPolyline) {
    // Check if there's only one feature with is_turning_point (new single-feature schema)
    const hasSingleFeatureWithTurningPoint =
        data.features.length === 1 &&
        data.features[0].properties.is_turning_point === true;

    if (hasSingleFeatureWithTurningPoint) {
        return transformPolylineSingleFeature(data);
    }

    // Multiple features - check if direction values exist
    const hasMultipleDirections = data.features.some(f =>
        f.properties.direction === 0 || f.properties.direction === 1
    );

    if (hasMultipleDirections) {
        return transformPolylineMultiFeature(data);
    }

    // Fallback: treat as single direction route
    return transformPolylineSingleFeature(data);
}

/**
 * Single Feature schema: One LineString contains the entire route.
 * Find the turning point (farthest point from start) and split there.
 */
function transformPolylineSingleFeature(data: GeoPolyline): {
    upPolyline: [number, number][][];
    downPolyline: [number, number][][];
} {
    const feature = data.features[0];
    if (!feature || !feature.geometry.coordinates.length) {
        return { upPolyline: [], downPolyline: [] };
    }

    // Convert [lng, lat] to [lat, lng] for Leaflet
    const coords = feature.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
    );

    // Find the turning point (farthest point from the start)
    const start = coords[0];
    let maxDist = 0;
    let turningPointIndex = 0;

    for (let i = 0; i < coords.length; i++) {
        const dist = getSquaredDistanceSimple(start, coords[i]);
        if (dist > maxDist) {
            maxDist = dist;
            turningPointIndex = i;
        }
    }

    // Split into up (start to turning point) and down (turning point to end)
    const upCoords = coords.slice(0, turningPointIndex + 1);
    const downCoords = coords.slice(turningPointIndex);

    return {
        upPolyline: upCoords.length > 1 ? [upCoords] : [],
        downPolyline: downCoords.length > 1 ? [downCoords] : []
    };
}

/**
 * Calculate squared distance between two points (for performance)
 */
function getSquaredDistanceSimple(p1: [number, number], p2: [number, number]): number {
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    return dLat * dLat + dLng * dLng;
}

/**
 * Multi-Feature schema: Split by direction property
 */
function transformPolylineMultiFeature(data: GeoPolyline): {
    upPolyline: [number, number][][];
    downPolyline: [number, number][][];
} {
    const upSegments: { coords: [number, number][]; seq: number }[] = [];
    const downSegments: { coords: [number, number][]; seq: number }[] = [];

    data.features.forEach((feature) => {
        const coords = feature.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
        );

        const props = feature.properties;
        const seq = Number(props.start_node_ord ?? 0);
        const direction = props.direction;

        // direction: 0 = down, 1 = up (matches updowncd in routeMap)
        if (direction === 1) {
            upSegments.push({ coords, seq });
        } else if (direction === 0) {
            downSegments.push({ coords, seq });
        }
    });

    upSegments.sort((a, b) => a.seq - b.seq);
    downSegments.sort((a, b) => a.seq - b.seq);

    return {
        upPolyline: upSegments.map((s) => s.coords),
        downPolyline: downSegments.map((s) => s.coords)
    };
}

/**
* Merge multiple polylines into a single polyline.
* Removes duplicate consecutive points for efficiency.
*/
export function mergePolylines(
    polylines: [number, number][][]
): [number, number][] {
    if (!polylines || polylines.length === 0) return [];

    return polylines
        .flat()
        .reduce<[number, number][]>((merged, point, index, arr) => {
            // Add only if it's the first point or different from the previous point (remove duplicates)
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
* Optimized using Squared Distance to avoid expensive Math.sqrt calls in the loop.
*/
export function snapToPolyline(
    P: [number, number],
    polyline: [number, number][]
): {
    position: [number, number];
    angle: number;
    segment: { A: [number, number]; B: [number, number] };
} {
    // If there are not enough points in the polyline, return the original point
    if (!polyline || polyline.length < 2)
        return {
            position: P, // Fallback to original position
            angle: 0,
            segment: { A: P, B: P },
        };

    let bestDistSq = Infinity; // Use squared distance
    let bestPosition: [number, number] = polyline[0];
    let bestSegment = { A: polyline[0], B: polyline[1] };

    // Iterate through all segments to find the closest projection point
    for (let i = 0; i < polyline.length - 1; i++) {
        const A = polyline[i];
        const B = polyline[i + 1];

        const projection = projectPointOnSegment(P, A, B);

        // Use squared distance instead of Euclidean distance (performance optimization)
        const dSq = getSqDist(P, projection);

        if (dSq < bestDistSq) {
            bestDistSq = dSq;
            bestPosition = projection;
            bestSegment = { A, B };
        }
    }

    // Calculate the angle of the best segment
    const angle = calculateBearing(bestSegment.A, bestSegment.B);

    return {
        position: bestPosition,
        angle,
        segment: bestSegment,
    };
}
