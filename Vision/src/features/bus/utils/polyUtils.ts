// src/features/bus/utils/polyUtils.ts

import { calculateBearing } from "@map/utils/geoUtils";

import type { GeoPolyline } from "@core/domain/polyline";

// ----------------------------------------------------------------------
// 1. Types & Interfaces
// ----------------------------------------------------------------------

export type Coordinate = [number, number]; // [Latitude, Longitude] for Leaflet
type GeoJSONCoordinate = [number, number]; // [Longitude, Latitude] for GeoJSON

export interface SplitResult {
    upPolyline: Coordinate[][];
    downPolyline: Coordinate[][];
}

// ----------------------------------------------------------------------
// 2. Helpers
// ----------------------------------------------------------------------

/**
 * Converts GeoJSON coordinates [Lng, Lat] to Leaflet coordinates [Lat, Lng].
 */
function toLatLngCoords(coords: GeoJSONCoordinate[]): Coordinate[] {
    return coords.map(([lng, lat]) => [lat, lng]);
}

function clampIndex(value: number, max: number): number {
    return Math.max(0, Math.min(value, max));
}

/**
 * Splits the array at a specific index (Turning Point).
 * Logic: 0 -> TurnIndex is UP, TurnIndex -> End is DOWN.
 */
function splitByTurnIndex(coords: Coordinate[], turnIndex: number): SplitResult {
    if (coords.length < 2) return { upPolyline: [], downPolyline: [] };

    const idx = clampIndex(Math.round(turnIndex), coords.length - 1);

    // Slice coordinates based on the turn index
    const upCoords = coords.slice(0, idx + 1); // Include turning point
    const downCoords = coords.slice(idx);      // Start from turning point

    return {
        // Wrap in array because Leaflet Polyline often expects MultiPolyline format or consistency
        upPolyline: upCoords.length > 1 ? [upCoords] : [],
        downPolyline: downCoords.length > 1 ? [downCoords] : [],
    };
}

// ----------------------------------------------------------------------
// 3. Main Transformation Logic
// ----------------------------------------------------------------------

/**
 * Main entry point to transform GeoJSON data into renderable Up/Down polylines.
 * Strictly adheres to the new GeoPolyline schema using `indices.turn_idx`.
 */
export function transformPolyline(data: GeoPolyline): SplitResult {
    // 1. Validate Feature Existence
    if (!data.features || data.features.length === 0) {
        return { upPolyline: [], downPolyline: [] };
    }

    // 2. Extract the main feature (Assume 1 Feature per route in new schema)
    const feature = data.features[0];
    const { geometry, properties } = feature;

    // 3. Convert Coordinates (GeoJSON [Lng,Lat] -> Leaflet [Lat,Lng])
    const coords = toLatLngCoords(geometry.coordinates);

    // 4. Split based on Turn Index if available
    if (properties.indices?.turn_idx !== undefined) {
        return splitByTurnIndex(coords, properties.indices.turn_idx);
    }

    // 5. Fallback: If no turn_idx, treat entire line as Up direction (One-way or Loop)
    // This is the safest default for the new schema if metadata is missing.
    return {
        upPolyline: coords.length > 1 ? [coords] : [],
        downPolyline: []
    };
}

// ----------------------------------------------------------------------
// 4. Geometry Snapping (Marker Projection)
// ----------------------------------------------------------------------
// Keeps the math logic for snapping bus markers to the road, 
// as this is independent of the schema structure but highly useful.

interface SnapResult {
    position: Coordinate;
    angle: number;
    segmentIndex: number;
    t: number; // normalized distance along segment (0~1)
}

/**
 * Snaps a raw GPS point to the nearest location on a polyline path.
 */
export function snapToPolyline(
    P: Coordinate,
    polyline: Coordinate[]
): SnapResult {
    if (!polyline || polyline.length < 2) {
        return { position: P, angle: 0, segmentIndex: 0, t: 0 };
    }

    let bestDistSq = Infinity;
    let bestPos: Coordinate = polyline[0];
    let bestIdx = 0;
    let bestT = 0;
    let bestSegment = { A: polyline[0], B: polyline[0] };

    // Iterate all segments to find the closest projection
    for (let i = 0; i < polyline.length - 1; i++) {
        const A = polyline[i];
        const B = polyline[i + 1];

        const AP_x = P[0] - A[0];
        const AP_y = P[1] - A[1];
        const AB_x = B[0] - A[0];
        const AB_y = B[1] - A[1];

        const ab2 = AB_x * AB_x + AB_y * AB_y;
        let t = 0;

        if (ab2 > 0) {
            const dot = AP_x * AB_x + AP_y * AB_y;
            t = Math.max(0, Math.min(1, dot / ab2)); // Clamp t [0, 1]
        }

        const projX = A[0] + AB_x * t;
        const projY = A[1] + AB_y * t;

        const dx = P[0] - projX;
        const dy = P[1] - projY;
        const dSq = dx * dx + dy * dy;

        if (dSq < bestDistSq) {
            bestDistSq = dSq;
            bestPos = [projX, projY];
            bestIdx = i;
            bestT = t;
            bestSegment = { A, B };
        }
    }

    return {
        position: bestPos,
        angle: calculateBearing(bestSegment.A, bestSegment.B),
        segmentIndex: bestIdx,
        t: bestT,
    };
}