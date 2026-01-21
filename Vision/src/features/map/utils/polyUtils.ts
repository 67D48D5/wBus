// src/features/bus/utils/polyUtils.ts

import { calculateBearing } from "@map/utils/geoUtils";

import type { GeoPolyline } from "@core/domain/polyline";

// ----------------------------------------------------------------------
// Types & Helpers
// ----------------------------------------------------------------------

type Coordinate = [number, number]; // [Latitude, Longitude]

/**
 * Helper: Calculate squared Euclidean distance between two points.
 * Optimization: Avoids `Math.sqrt()` which is computationally expensive.
 * Useful when we only need to compare distances (e.g., finding the maximum or minimum),
 * not the exact magnitude.
 */
function getSquaredDistance(p1: Coordinate, p2: Coordinate): number {
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    return dLat * dLat + dLng * dLng;
}

// ----------------------------------------------------------------------
// Polyline Transformation Logic
// ----------------------------------------------------------------------

/**
 * Transforms raw GeoJSON data into separate polylines for Up (Outbound) and Down (Inbound) directions.
 * * This function handles two distinct data schemas from the API:
 * 1. **Single Feature Schema (New):** A single continuous line containing the full round trip.
 * - We use a distance heuristic to find the "turning point" and split it.
 * 2. **Multi-Feature Schema (Legacy):** Separate segments with explicit `direction` and `sequence` properties.
 * - We group and sort these segments to reconstruct the lines.
 */
export function transformPolyline(data: GeoPolyline) {
    // 1. Check for Single Feature Schema (with "is_turning_point" property)
    const hasSingleFeatureWithTurningPoint =
        data.features.length === 1 &&
        data.features[0].properties.is_turning_point === true;

    if (hasSingleFeatureWithTurningPoint) {
        return transformPolylineSingleFeature(data);
    }

    // 2. Check for Multi-Feature Schema (with explicit "direction" property)
    const hasMultipleDirections = data.features.some(f =>
        f.properties.direction === 0 || f.properties.direction === 1
    );

    if (hasMultipleDirections) {
        return transformPolylineMultiFeature(data);
    }

    // 3. Fallback
    return transformPolylineSingleFeature(data);
}

/**
 * Handle Single Feature Schema:
 * The API provides one giant line (Start -> Turning Point -> End/Start).
 * Algorithm:
 * - We assume the route is generally U-shaped or linear.
 * - The "Turning Point" is assumed to be the coordinate farthest from the Start Node.
 * - We split the array at this index.
 */
function transformPolylineSingleFeature(data: GeoPolyline): {
    upPolyline: Coordinate[][];
    downPolyline: Coordinate[][];
} {
    const feature = data.features[0];
    if (!feature || !feature.geometry.coordinates.length) {
        return { upPolyline: [], downPolyline: [] };
    }

    // Leaflet requires [lat, lng], but GeoJSON provides [lng, lat]. Flip here.
    const coords = feature.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as Coordinate
    );

    // Find the turning point (Max distance from start)
    const start = coords[0];
    let maxDist = 0;
    let turningPointIndex = 0;

    for (let i = 0; i < coords.length; i++) {
        const dist = getSquaredDistance(start, coords[i]);
        if (dist > maxDist) {
            maxDist = dist;
            turningPointIndex = i;
        }
    }

    // Split the array
    // Up: Start -> Turning Point
    // Down: Turning Point -> End
    const upCoords = coords.slice(0, turningPointIndex + 1);
    const downCoords = coords.slice(turningPointIndex);

    return {
        upPolyline: upCoords.length > 1 ? [upCoords] : [],
        downPolyline: downCoords.length > 1 ? [downCoords] : []
    };
}

/**
 * Handle Multi-Feature Schema:
 * The API provides many small LineStrings, each with a 'direction' (0/1) and 'start_node_ord' (sequence).
 * Algorithm:
 * - Group segments by direction.
 * - Sort segments by sequence number.
 */
function transformPolylineMultiFeature(data: GeoPolyline): {
    upPolyline: Coordinate[][];
    downPolyline: Coordinate[][];
} {
    const upSegments: { coords: Coordinate[]; seq: number }[] = [];
    const downSegments: { coords: Coordinate[]; seq: number }[] = [];

    data.features.forEach((feature) => {
        // Flip GeoJSON [lng, lat] to Leaflet [lat, lng]
        const coords = feature.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as Coordinate
        );

        const props = feature.properties;
        const seq = Number(props.start_node_ord ?? 0);
        const direction = props.direction;

        // Group by direction (1 = Up/Outbound, 0 = Down/Inbound)
        if (direction === 1) {
            upSegments.push({ coords, seq });
        } else if (direction === 0) {
            downSegments.push({ coords, seq });
        }
    });

    // Sort by sequence to ensure continuity
    upSegments.sort((a, b) => a.seq - b.seq);
    downSegments.sort((a, b) => a.seq - b.seq);

    return {
        upPolyline: upSegments.map((s) => s.coords),
        downPolyline: downSegments.map((s) => s.coords)
    };
}

/**
 * Merges an array of polyline segments into a single continuous path array.
 * Removes duplicate adjacent points to optimize rendering performance.
 */
export function mergePolylines(polylines: Coordinate[][]): Coordinate[] {
    if (!polylines || polylines.length === 0) return [];

    return polylines
        .flat()
        .reduce<Coordinate[]>((merged, point, index, arr) => {
            // Only add the point if it is distinct from the previous one
            const isFirst = index === 0;
            const isDifferent = !isFirst && (
                point[0] !== arr[index - 1][0] ||
                point[1] !== arr[index - 1][1]
            );

            if (isFirst || isDifferent) {
                merged.push(point);
            }
            return merged;
        }, []);
}

// ----------------------------------------------------------------------
// Geometry Snapping Logic
// ----------------------------------------------------------------------

/**
 * Snaps a raw GPS point to the nearest location on a polyline path.
 * 
 * * Why?
 * Raw GPS data can be noisy (jittery) or offset. This function projects that point
 * onto the clean road geometry to ensure the bus marker stays on the road.
 *
 * @param P - The raw GPS Point (User or Bus location)
 * @param polyline - The route path (Array of coordinates)
 */
export function snapToPolyline(
    P: Coordinate,
    polyline: Coordinate[]
): {
    position: Coordinate;    // The corrected "snapped" coordinate
    angle: number;           // The bearing of the road segment (0-360)
    segment: { A: Coordinate; B: Coordinate }; // The segment used for snapping
    segmentIndex: number;
    t: number;               // Normalized distance along the segment (0 to 1)
} {
    // Safety check: A line needs at least 2 points
    if (!polyline || polyline.length < 2) {
        return {
            position: P,
            angle: 0,
            segment: { A: P, B: P },
            segmentIndex: 0,
            t: 0,
        };
    }

    let bestDistSq = Infinity;
    let bestPosition: Coordinate = polyline[0];
    let bestSegment = { A: polyline[0], B: polyline[1] };
    let bestSegmentIndex = 0;
    let bestT = 0;

    // Iterate over every segment (Line A-B)
    for (let i = 0; i < polyline.length - 1; i++) {
        const A = polyline[i];
        const B = polyline[i + 1];

        // Vector AP (A -> P) and AB (A -> B)
        const AP = [P[0] - A[0], P[1] - A[1]];
        const AB = [B[0] - A[0], B[1] - A[1]];
        const ab2 = AB[0] * AB[0] + AB[1] * AB[1];

        // Calculate projection scalar 't'
        let t = 0;
        if (ab2 > 0) {
            const dot = AP[0] * AB[0] + AP[1] * AB[1];
            t = dot / ab2;
            // Clamp t to segment bounds [0, 1]
            if (t < 0) t = 0;
            if (t > 1) t = 1;
        }

        // Calculate the projected point
        const projection: Coordinate = [
            A[0] + AB[0] * t,
            A[1] + AB[1] * t
        ];

        // Distance squared from P to Projection
        const dSq = getSquaredDistance(P, projection);

        // Keep the closest one
        if (dSq < bestDistSq) {
            bestDistSq = dSq;
            bestPosition = projection;
            bestSegment = { A, B };
            bestSegmentIndex = i;
            bestT = t;
        }
    }

    // Calculate the driving direction (bearing) of the matched segment
    const angle = calculateBearing(bestSegment.A, bestSegment.B);

    return {
        position: bestPosition,
        angle,
        segment: bestSegment,
        segmentIndex: bestSegmentIndex,
        t: bestT,
    };
}
