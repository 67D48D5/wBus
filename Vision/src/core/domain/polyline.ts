// src/core/domain/polyline.ts

/**
 * GeoJSON Feature for bus route polylines.
 */
export type GeoFeature = {
    type: "Feature";
    properties: {
        route_id: string;
        route_no: string;
        stops: Array<{
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
    };
    geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type GeoPolyline = {
    type: "FeatureCollection";
    features: GeoFeature[];
};
