// src/core/domain/polyline.ts

/**
 * GeoJSON Feature for bus route polylines.
 * 
 * Schema:
 * - Single Feature contains the entire route (up + down combined)
 * - direction: 0 (reserved, actual direction is derived from turning point)
 * - is_turning_point: true indicates this is a round-trip route
 * - start_node_ord: ordering number (1 for single-feature routes)
 * 
 * The turning point is automatically detected by finding the farthest point
 * from the start of the route.
 */
export type GeoFeature = {
    type: "Feature";
    properties: {
        direction: number;  // 0 or 1 (when multiple features with explicit directions)
        is_turning_point: boolean;
        start_node_ord: number;
    };
    geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type GeoPolyline = {
    type: "FeatureCollection";
    features: GeoFeature[];
};
