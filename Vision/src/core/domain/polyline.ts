// src/core/domain/polyline.ts

// Polyline
export type GeoFeature = {
    type: "Feature";
    properties: { dir: "up" | "down" };
    geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type GeoPolyline = {
    type: "FeatureCollection";
    features: GeoFeature[];
};
