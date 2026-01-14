// src/features/live/utils/polyUtils.ts

import {
    calculateBearing,
    projectPointOnSegment
} from "@live/utils/geoUtils";

import { GeoPolylineData } from "@core/domain/live";

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
* [Important] Data may not come in order, so sorting by seq or similar properties is necessary.
*/
export function transformPolyline(data: GeoPolylineData) {
    const upSegments: { coords: [number, number][], seq: number }[] = [];
    const downSegments: { coords: [number, number][], seq: number }[] = [];

    // 1. Iterate through data to separate up/down directions and extract order (seq)
    data.features.forEach((feature) => {
        // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
        const coords = feature.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
        );

        const props = feature.properties as any;

        // If there is order info (seq, turn_seq, section_id, etc.) in the data, use it (default 0)
        const seq = Number(props.seq || props.turn_seq || props.section_id || 0);

        // Support both new scheme (dir: "up"/"down") and legacy scheme (updnDir: "1"/"0")
        if (props.dir === "up" || props.updnDir === "1") {
            upSegments.push({ coords, seq });
        } else if (props.dir === "down" || props.updnDir === "0") {
            downSegments.push({ coords, seq });
        }
    });

    // 2. Sort by order (seq) to avoid zigzag connections in the polyline
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
