// src/route/model.rs

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use serde_json::Value;

// ============================================================================
// Raw Data Models (Saved to raw_routes/)
// ============================================================================

/// Raw station information fetched from the API (for preservation)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawStop {
    pub node_id: String,
    pub node_nm: String,
    pub node_ord: i64,
    pub node_no: String,
    pub gps_lat: f64,
    pub gps_long: f64,
    pub up_down_cd: i64,
}

/// Raw file save format
#[derive(Serialize, Deserialize)]
pub struct RawRouteFile {
    pub route_id: String,
    pub route_no: String,
    pub fetched_at: String,
    pub stops: Vec<RawStop>,
}

// ============================================================================
// Derived Data Models (Saved to derived_routes/)
// ============================================================================

/// GeoJSON structure for Frontend
#[derive(Serialize)]
pub struct DerivedFeatureCollection {
    #[serde(rename = "type")]
    pub type_: String, // "FeatureCollection"
    pub features: Vec<DerivedFeature>,
}

#[derive(Serialize)]
pub struct DerivedFeature {
    #[serde(rename = "type")]
    pub type_: String, // "Feature"
    pub id: String,
    pub bbox: Option<Vec<f64>>,
    pub properties: FrontendProperties,
    pub geometry: RouteGeometry,
}

#[derive(Serialize)]
pub struct RouteGeometry {
    #[serde(rename = "type")]
    pub type_: String, // "LineString"
    pub coordinates: Vec<Vec<f64>>,
}

/// [Core] Lightweight Properties containing only essential info for Frontend
#[derive(Serialize)]
pub struct FrontendProperties {
    // Basic Info
    pub route_id: String,
    pub route_no: String,

    // Station list for UI display (excluding coordinates, only Name/ID/Order)
    // Coordinates are referenced via geometry or routeMap.json.
    // Included here to map logical position on the path.
    pub stops: Vec<FrontendStop>,

    // Indices for rendering/animation
    pub indices: RouteIndices,

    // Metadata (Minimal, for debugging)
    pub meta: FrontendMeta,
}

#[derive(Serialize)]
pub struct FrontendStop {
    pub id: String,
    pub name: String,
    pub ord: i64,
    pub up_down: i64,
}

#[derive(Serialize)]
pub struct RouteIndices {
    pub turn_idx: usize, // Index of the turning point coordinate
    // Mapping: Station ID -> Index on the full route path (coordinates)
    pub stop_to_coord: Vec<usize>,
}

#[derive(Serialize)]
pub struct FrontendMeta {
    pub total_dist: f64,
    pub source_ver: String, // e.g., "raw-20260121"
}

/// Internal processing structure
pub struct RouteProcessData {
    pub route_id: String,
    pub route_no: String,
    pub details: Value,
    pub stops_map: Vec<(String, Value)>,
}

/// Main processor structure
pub struct BusRouteProcessor {
    pub service_key: String,
    pub city_code: String,
    pub raw_dir: PathBuf,
    pub derived_dir: PathBuf,
    pub mapping_file: PathBuf,
    pub tago_base_url: String,
    pub osrm_base_url: String,
}
