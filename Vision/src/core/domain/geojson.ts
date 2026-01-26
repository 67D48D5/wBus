// Vision/src/core/domain/geojson.ts

// Future GeoJSON Feature for bus route polylines with extended structure
// Not yet in use, but designed for future scalability

export interface BusRouteFeatureCollection {
    type: "FeatureCollection";
    // Could be extended to multiple features in the future
    features: [BusRouteFeature];
}

export interface BusRouteFeature {
    type: "Feature";
    route_id: string;

    /**
     * [minLon, minLat, maxLon, maxLat]
     * Standard GeoJSON bounding box format, used for map viewport fitting.
     */
    bbox: [number, number, number, number];

    // GeoJSON Geometry
    geometry: {
        type: "LineString";
        coordinates: Array<[number, number]>; // [lng, lat]
    };

    properties: BusRouteProperties;
}

export interface BusRouteProperties {
    // Unique identifier for the bus route
    route_id: string;
    // Route name should be string to accommodate alphanumeric names
    route_no: string;

    meta: {
        total_dist: number; // Unit: meter (m)
        source_ver: string; // ISO 8601 Date String
    };

    /**
     * Core index data defining the relationship between the route and stops
     */
    indices: {
        /**
         * The index in the coordinates array where the turn point is located
         * (Used for distinguishing up/down directions and arrow rendering branching points)
         */
        turn_idx: number;

        /**
         * Array mapping stops[i] to coordinates[j]
         * Example: stops[0] corresponds to coordinates[0], stops[1] corresponds to coordinates[24]
         */
        stop_to_coord: number[];
    };

    stops: Array<{
        id: string;      // Stop ID
        name: string;    // Stop name
        ord: number;     // Order
        up_down: number; // 0: Up direction, 1: Down direction (or according to data source code)
    }>;
}