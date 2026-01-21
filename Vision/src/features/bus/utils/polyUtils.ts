// src/features/bus/utils/polyUtils.ts

import { calculateBearing } from "@map/utils/geoUtils";

import type { GeoPolyline } from "@core/domain/polyline";

// ----------------------------------------------------------------------
// 1. Types & Interfaces
// ----------------------------------------------------------------------

type Coordinate = [number, number]; // [Latitude, Longitude] for Leaflet
type GeoJSONCoordinate = [number, number]; // [Longitude, Latitude] for GeoJSON

interface SplitResult {
    upPolyline: Coordinate[][];
    downPolyline: Coordinate[][];
}

// Backend Properties (Lightweight)
interface RouteIndices {
    turn_idx: number;
    stop_to_coord?: number[];
}

// Backend Properties (Full)
interface RouteDerivedIndex {
    turn_coord_idx: number;
    segments?: Array<{ dir: "up" | "down"; from: number; to: number }>;
}

// ----------------------------------------------------------------------
// 2. Math & Geometry Helpers
// ----------------------------------------------------------------------

/**
 * Calculates squared Euclidean distance.
 * Optimized for comparisons (avoids Math.sqrt).
 */
function getSquaredDistance(p1: Coordinate, p2: Coordinate): number {
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    return dLat * dLat + dLng * dLng;
}

function clampIndex(value: number, max: number): number {
    return Math.max(0, Math.min(value, max));
}

/**
 * Converts GeoJSON coordinates [Lng, Lat] to Leaflet coordinates [Lat, Lng].
 */
function toLatLngCoords(coords: GeoJSONCoordinate[]): Coordinate[] {
    return coords.map(([lng, lat]) => [lat, lng]);
}

// ----------------------------------------------------------------------
// 3. Splitting Strategies
// ----------------------------------------------------------------------

/**
 * Strategy A: Explicit Segments (Best)
 * Uses explicitly defined ranges for up/down directions.
 */
function splitBySegments(
    coords: Coordinate[],
    segments: NonNullable<RouteDerivedIndex["segments"]>
): SplitResult {
    const upCoords: Coordinate[][] = [];
    const downCoords: Coordinate[][] = [];
    const maxIdx = coords.length - 1;

    // Sort segments by order to ensure continuity
    const sortedSegments = [...segments].sort((a, b) => a.from - b.from);

    for (const seg of sortedSegments) {
        const start = clampIndex(seg.from, maxIdx);
        const end = clampIndex(seg.to, maxIdx);

        // Ensure logical slice direction
        const [from, to] = start <= end ? [start, end] : [end, start];
        const segmentCoords = coords.slice(from, to + 1);

        if (segmentCoords.length < 2) continue;

        if (seg.dir === "up") {
            upCoords.push(segmentCoords);
        } else {
            downCoords.push(segmentCoords);
        }
    }

    return { upPolyline: upCoords, downPolyline: downCoords };
}

/**
 * Strategy B: Index Split (Standard)
 * Splits the array at a specific index (Turning Point).
 * Assumes: 0 -> TurnIndex is UP, TurnIndex -> End is DOWN.
 */
function splitByTurnIndex(coords: Coordinate[], turnIndex: number): SplitResult {
    if (coords.length < 2) return { upPolyline: [], downPolyline: [] };

    const idx = clampIndex(Math.round(turnIndex), coords.length - 1);
    const upCoords = coords.slice(0, idx + 1); // Include turning point
    const downCoords = coords.slice(idx);      // Start from turning point

    return {
        upPolyline: upCoords.length > 1 ? [upCoords] : [],
        downPolyline: downCoords.length > 1 ? [downCoords] : [],
    };
}

/**
 * Strategy C: Distance Heuristic (Legacy Fallback)
 * Finds the point farthest from the start node and assumes it's the turning point.
 * Used when no metadata is available.
 */
function splitByMaxDistance(coords: Coordinate[]): SplitResult {
    if (coords.length < 2) return { upPolyline: [], downPolyline: [] };

    const start = coords[0];
    let maxDist = 0;
    let turnIdx = 0;

    for (let i = 1; i < coords.length; i++) {
        const dist = getSquaredDistance(start, coords[i]);
        if (dist > maxDist) {
            maxDist = dist;
            turnIdx = i;
        }
    }

    return splitByTurnIndex(coords, turnIdx);
}

// ----------------------------------------------------------------------
// 4. Main Transformation Logic
// ----------------------------------------------------------------------

/**
 * Main entry point to transform GeoJSON data into renderable Up/Down polylines.
 * automatically detects the schema version.
 */
export function transformPolyline(data: GeoPolyline): SplitResult {
    if (!data.features || data.features.length === 0) {
        return { upPolyline: [], downPolyline: [] };
    }

    // [Priority 1] Frontend-Optimized Schema (Lightweight)
    // Has `properties.indices.turn_idx`
    const v2Feature = data.features.find(f =>
        typeof f.properties?.indices?.turn_idx === "number"
    );
    if (v2Feature) {
        const coords = toLatLngCoords(v2Feature.geometry.coordinates);
        const { turn_idx } = v2Feature.properties.indices as RouteIndices;
        return splitByTurnIndex(coords, turn_idx);
    }

    // [Priority 2] Full Schema (Derived Data)
    // Has `properties.derived.geometry_index`
    const derivedFeature = data.features.find(f =>
        f.properties?.derived?.geometry_index
    );
    if (derivedFeature?.properties?.derived) {
        const coords = toLatLngCoords(derivedFeature.geometry.coordinates);
        const indexData = derivedFeature.properties.derived.geometry_index as RouteDerivedIndex;

        // Prefer explicit segments if available
        if (indexData.segments && indexData.segments.length > 0) {
            return splitBySegments(coords, indexData.segments);
        }
        // Fallback to turn index
        if (typeof indexData.turn_coord_idx === "number") {
            return splitByTurnIndex(coords, indexData.turn_coord_idx);
        }
    }

    // [Priority 3] Legacy Multi-Feature Schema
    // Multiple features with explicit `direction` property (0 or 1)
    const hasMultiFeatures = data.features.some(f =>
        typeof f.properties?.direction === "number"
    );
    if (hasMultiFeatures) {
        return transformLegacyMultiFeature(data.features);
    }

    // [Priority 4] Legacy Single Feature Fallback
    // Just one line, guess based on distance
    const singleFeature = data.features[0];
    if (singleFeature) {
        const coords = toLatLngCoords(singleFeature.geometry.coordinates);
        return splitByMaxDistance(coords);
    }

    return { upPolyline: [], downPolyline: [] };
}

/**
 * Handles legacy data where the route is split into many small GeoJSON features
 */
function transformLegacyMultiFeature(features: GeoPolyline["features"]): SplitResult {
    const upSegments: { coords: Coordinate[]; seq: number }[] = [];
    const downSegments: { coords: Coordinate[]; seq: number }[] = [];

    features.forEach((feature) => {
        const coords = toLatLngCoords(feature.geometry.coordinates);
        const props = feature.properties;
        const seq = Number(props?.start_node_ord ?? 0);
        const dir = props?.direction;

        if (dir === 1) { // 1 = Up
            upSegments.push({ coords, seq });
        } else if (dir === 0) { // 0 = Down
            downSegments.push({ coords, seq });
        }
    });

    // Sort by sequence
    const sortBySeq = (a: { seq: number }, b: { seq: number }) => a.seq - b.seq;
    upSegments.sort(sortBySeq);
    downSegments.sort(sortBySeq);

    return {
        upPolyline: upSegments.map(s => s.coords),
        downPolyline: downSegments.map(s => s.coords),
    };
}

// ----------------------------------------------------------------------
// 5. Utility Exports
// ----------------------------------------------------------------------

export function mergePolylines(polylines: Coordinate[][]): Coordinate[] {
    if (!polylines.length) return [];

    return polylines.flat().reduce<Coordinate[]>((merged, point, i, arr) => {
        const isFirst = i === 0;
        // Deduplicate adjacent points
        if (isFirst || point[0] !== arr[i - 1][0] || point[1] !== arr[i - 1][1]) {
            merged.push(point);
        }
        return merged;
    }, []);
}

export function hasExplicitPolylineDirections(data: GeoPolyline): boolean {
    return data.features.some((f) => {
        const p = f.properties;
        return (
            typeof p?.indices?.turn_idx === "number" || // Light
            typeof p?.derived?.geometry_index?.turn_coord_idx === "number" || // Full
            (p?.direction === 0 || p?.direction === 1) // Legacy
        );
    });
}

// ----------------------------------------------------------------------
// 6. Geometry Snapping (Marker Projection)
// ----------------------------------------------------------------------

interface SnapResult {
    position: Coordinate;
    angle: number;
    segmentIndex: number;
    // t: normalized distance along segment (0~1), useful for interpolation
    t: number;
}

/**
 * Snaps a raw GPS point to the nearest location on a polyline path.
 * Returns the snapped position and the angle (bearing) of the road.
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

        // Distance check
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
