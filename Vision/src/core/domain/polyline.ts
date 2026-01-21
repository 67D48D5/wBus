// src/core/domain/polyline.ts

// Polyline
export type GeoFeature = {
    type: "Feature";
    properties: {
        direction: 0 | 1;  // 0 = up (상행), 1 = down (하행)
        is_turning_point: boolean;
        start_node_ord: number;
    };
    geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type GeoPolyline = {
    type: "FeatureCollection";
    features: GeoFeature[];
};
