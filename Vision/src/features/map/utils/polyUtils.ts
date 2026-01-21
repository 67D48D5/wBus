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
* New schema:
* - direction: 0 = up (상행), 1 = down (하행)
* - start_node_ord: ordering number for segments
* - is_turning_point: indicates if this segment is a turning point
*/
export function transformPolyline(data: GeoPolyline) {
    const upSegments: { coords: [number, number][], seq: number, isTurningPoint: boolean }[] = [];
    const downSegments: { coords: [number, number][], seq: number, isTurningPoint: boolean }[] = [];

    // 1. Iterate through data to separate up/down directions and extract order
    data.features.forEach((feature) => {
        // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
        const coords = feature.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
        );

        const props = feature.properties;

        // Use start_node_ord for ordering (fallback to legacy props if needed)
        const seq = Number(
            props.start_node_ord ??
            (props as any).seq ??
            (props as any).turn_seq ??
            (props as any).section_id ??
            0
        );
        const isTurningPoint = props.is_turning_point ?? false;

        // New schema: direction 0 = up, direction 1 = down
        // Also support legacy schemas for backward compatibility
        const legacyProps = props as any;
        if (props.direction === 0 || legacyProps.dir === "up" || legacyProps.updnDir === "1") {
            upSegments.push({ coords, seq, isTurningPoint });
        } else if (props.direction === 1 || legacyProps.dir === "down" || legacyProps.updnDir === "0") {
            downSegments.push({ coords, seq, isTurningPoint });
        }
    });

    // 2. Sort by order (start_node_ord) to avoid zigzag connections in the polyline
    upSegments.sort((a, b) => a.seq - b.seq);
    downSegments.sort((a, b) => a.seq - b.seq);

    return {
        upPolyline: upSegments.map(s => s.coords),
        downPolyline: downSegments.map(s => s.coords)
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
