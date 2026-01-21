// src/core/domain/polyline.ts

/**
 * GeoJSON Feature for bus route polylines.
 *
 * Supported schemas:
 * - Legacy: multi-feature with explicit direction/start order.
 * - Legacy: single-feature with turning point heuristic.
 * - Indexed: single-feature with `indices.turn_idx` (new schema).
 */
export type GeoFeature = {
    type: "Feature";
    properties: {
        direction?: number;  // 0 or 1 (when multiple features with explicit directions)
        is_turning_point?: boolean;
        start_node_ord?: number;
        schema?: string;
        route_id?: string;
        route_no?: string;
        stops?: Array<{
            id: string;
            name: string;
            ord: number;
            up_down: number; // 0 = down, 1 = up
        }>;
        indices?: {
            turn_idx?: number;
            stop_to_coord?: number[];
        };
        meta?: {
            total_dist?: number;
            bbox?: [number, number, number, number];
            source_ver?: string;
        };
        derived?: {
            geometry_index?: {
                turn_coord_idx?: number;
                segments?: Array<{
                    dir: "up" | "down";
                    from: number;
                    to: number;
                }>;
                stop_to_coord_idx?: Array<{
                    node_id: string;
                    coord_idx: number;
                }>;
            };
        };
    };
    geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type GeoPolyline = {
    type: "FeatureCollection";
    features: GeoFeature[];
};
