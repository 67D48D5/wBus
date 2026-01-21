// src/route/mod.rs

use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::Result;
use chrono::Local;
use futures::stream::{self, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use super::utils;

// ============================================================================
// Constants & Configuration
// ============================================================================

const TAGO_URL: &str = "http://apis.data.go.kr/1613000/BusRouteInfoInqireService";

// OSRM 'route' service is used to generate smooth, road-snapped polylines.
const OSRM_URL: &str = "http://router.project-osrm.org/route/v1/driving";

// Concurrency limits to manage API rate limits and server load.
const CONCURRENCY_FETCH: usize = 10; // Tago API (Public Data Portal) limit
const CONCURRENCY_SNAP: usize = 4; // OSRM Server (CPU intensive) limit

// OSRM URL character/point limit. We chunk stops to avoid 414 URI Too Long errors.
const OSRM_CHUNK_SIZE: usize = 140;

// ============================================================================
// Data Models
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Stop {
    node_id: String,
    node_nm: String,
    node_ord: i64, // Sequence order of the stop within the route
    node_no: String,
    gps_lat: f64,
    gps_long: f64,
    up_down_cd: i64, // 0: Down/Descending, 1: Up/Ascending (Directional code)
}

/// Holds aggregated data for a single processed route.
struct RouteData {
    route_id: String,
    route_no: String,
    details: Value,                  // Metadata for route_details (JSON)
    stops_map: Vec<(String, Value)>, // List of (NodeID, NodeData) for the station map
}

// ============================================================================
// Main Execution
// ============================================================================

pub async fn run(
    city_code: String,
    specific_route: Option<String>,
    output_dir: PathBuf,
    station_map_only: bool,
    osrm_only: bool,
) -> Result<()> {
    // 1. Environment Verification
    let service_key = utils::get_env("DATA_GO_KR_SERVICE_KEY");
    if service_key.is_empty() {
        anyhow::bail!("DATA_GO_KR_SERVICE_KEY is missing in .env");
    }

    let raw_dir = output_dir.join("raw_routes");
    let snapped_dir = output_dir.join("snapped_routes");

    utils::ensure_dir(&raw_dir)?;
    utils::ensure_dir(&snapped_dir)?;

    let processor = Arc::new(BusRouteProcessor {
        service_key,
        city_code,
        raw_dir: raw_dir.clone(),
        snapped_dir: snapped_dir.clone(),
        mapping_file: output_dir.join("routeMap.json"),
        tago_base_url: resolve_url("TAGO_API_URL", TAGO_URL),
        osrm_base_url: resolve_url("OSRM_API_URL", OSRM_URL),
    });

    // 2. Phase 1: Data Collection (Fetch from Public API)
    if !osrm_only {
        println!("\n[Phase 1: Data Collection & Stop Ordering]");
        let routes = processor.get_all_routes().await?;

        // Filter for specific route if requested (by Route Number, e.g., "10-1")
        let target_routes: Vec<Value> = if let Some(target_no) = specific_route.as_ref() {
            routes
                .into_iter()
                .filter(|r| parse_flexible_string(&r["routeno"]) == *target_no)
                .collect()
        } else {
            routes
        };
        println!(" Targeting {} routes...", target_routes.len());

        // Process routes concurrently
        let mut route_stream = stream::iter(target_routes)
            .map(|route| {
                let proc = Arc::clone(&processor);
                async move { proc.process_single_route(route, !station_map_only).await }
            })
            .buffer_unordered(CONCURRENCY_FETCH);

        // Aggregation structures for the master map
        let mut all_stops = BTreeMap::new();
        let mut route_details_map = HashMap::new();
        let mut route_mapping: BTreeMap<String, Vec<String>> = BTreeMap::new();
        let mut count = 0usize;

        while let Some(result) = route_stream.next().await {
            match result {
                Ok(Some(data)) => {
                    count += 1;

                    // Aggregate data
                    route_details_map.insert(data.route_id.clone(), data.details);
                    route_mapping
                        .entry(data.route_no)
                        .or_default()
                        .push(data.route_id);

                    for (id, val) in data.stops_map {
                        all_stops.insert(id, val);
                    }

                    if count % 10 == 0 {
                        print!(".");
                    }
                }
                Ok(None) => {} // Skipped (empty or invalid)
                Err(e) => eprintln!("\n Error processing route: {:?}", e),
            }
        }
        println!("\n Processed {} routes.", count);

        // Save the master route map JSON
        processor.save_route_map_json(&route_mapping, &route_details_map, &all_stops)?;

        if station_map_only {
            println!("✓ Station map generation complete.");
            return Ok(());
        }
    }

    // 3. Phase 2: OSRM Snapping (Map Matching / Routing)
    println!("\n[Phase 2: Route Snapping via OSRM Match]");

    let raw_entries: Vec<_> = fs::read_dir(&raw_dir)?.filter_map(|e| e.ok()).collect();

    let mut snap_stream = stream::iter(raw_entries)
        .map(|entry| {
            let proc = Arc::clone(&processor);
            let specific = specific_route.clone();
            async move {
                let path = entry.path();
                // Process only .json files (raw stop lists), convert to .geojson
                if path.extension().map_or(false, |ext| ext == "json") {
                    let fname = path.file_name().unwrap().to_string_lossy();

                    // Apply filter if needed (Matches against filename/Route ID)
                    if let Some(ref target) = specific {
                        // Note: Since filenames are now only Route IDs (e.g. WJB...),
                        // filtering by Route Number (e.g. "10") here won't work unless
                        // the file content is checked.
                        if !fname.contains(target) {
                            return Ok(());
                        }
                    }

                    println!(" Snapping {}...", fname);
                    proc.snap_route_file(&path).await
                } else {
                    Ok(())
                }
            }
        })
        .buffer_unordered(CONCURRENCY_SNAP);

    while let Some(res) = snap_stream.next().await {
        if let Err(e) = res {
            eprintln!(" Snap failed: {:?}", e);
        }
    }

    println!("✓ Work Complete.");
    Ok(())
}

// ============================================================================
// Processor Implementation
// ============================================================================

struct BusRouteProcessor {
    service_key: String,
    city_code: String,
    raw_dir: PathBuf,
    snapped_dir: PathBuf,
    mapping_file: PathBuf,
    tago_base_url: String,
    osrm_base_url: String,
}

impl BusRouteProcessor {
    /// Fetches the complete list of route IDs for the target city.
    async fn get_all_routes(&self) -> Result<Vec<Value>> {
        let params = [
            ("cityCode", self.city_code.as_str()),
            ("numOfRows", "2000"), // Ensure capacity for all routes
            ("pageNo", "1"),
            ("serviceKey", self.service_key.as_str()),
            ("_type", "json"),
        ];
        let url = format!("{}/getRouteNoList", self.tago_base_url);
        let resp = reqwest::Client::new()
            .get(&url)
            .query(&params)
            .send()
            .await?;
        let json: Value = resp.json().await?;
        extract_items(&json)
    }

    /// Fetches stop data for a single route, sorts it, and saves the raw JSON.
    async fn process_single_route(
        &self,
        route_info: Value,
        save_file: bool,
    ) -> Result<Option<RouteData>> {
        let route_id = route_info["routeid"]
            .as_str()
            .unwrap_or_default()
            .to_string();
        let route_no = parse_flexible_string(&route_info["routeno"]);

        if route_no == "UNKNOWN" || route_id.is_empty() {
            return Ok(None);
        }

        let params = [
            ("cityCode", self.city_code.as_str()),
            ("routeId", route_id.as_str()),
            ("numOfRows", "1024"), // Max stops per route (approximate)
            ("serviceKey", self.service_key.as_str()),
            ("_type", "json"),
        ];
        let url = format!("{}/getRouteAcctoThrghSttnList", self.tago_base_url);
        let resp = reqwest::Client::new()
            .get(&url)
            .query(&params)
            .send()
            .await?;

        let json: Value = match resp.json().await {
            Ok(v) => v,
            Err(_) => return Ok(None),
        };

        let items = extract_items(&json)?;
        if items.is_empty() {
            return Ok(None);
        }

        // Map JSON items to internal Stop structs
        let mut stops: Vec<Stop> = items
            .iter()
            .map(|item| Stop {
                node_id: item["nodeid"].as_str().unwrap_or("").to_string(),
                node_nm: item["nodenm"].as_str().unwrap_or("").to_string(),
                node_ord: item["nodeord"].as_i64().unwrap_or(0),
                node_no: item["nodeno"]
                    .as_i64()
                    .map(|n| n.to_string())
                    .unwrap_or_else(|| item["nodeno"].as_str().unwrap_or("").to_string()),
                gps_lat: item["gpslati"].as_f64().unwrap_or(0.0),
                gps_long: item["gpslong"].as_f64().unwrap_or(0.0),
                up_down_cd: item["updowncd"]
                    .as_i64()
                    .or_else(|| item["updowncd"].as_str().and_then(|s| s.parse().ok()))
                    .unwrap_or(0),
            })
            .collect();

        // STRICT ORDERING: Sort by node_ord to ensure a linear path sequence
        stops.sort_by_key(|s| s.node_ord);

        // Generate metadata
        let sequence_meta: Vec<Value> = stops
            .iter()
            .map(|s| {
                json!({
                "nodeid": s.node_id,
                "nodeord": s.node_ord,
                "updowncd": s.up_down_cd
                })
            })
            .collect();

        let stops_map_data: Vec<(String, Value)> = stops
            .iter()
            .map(|s| {
                (
                    s.node_id.clone(),
                    json!({
                    "nodenm": s.node_nm,
                    "nodeno": s.node_no,
                    "gpslati": s.gps_lat,
                    "gpslong": s.gps_long
                    }),
                )
            })
            .collect();

        let details = json!({ "routeno": route_no, "sequence": sequence_meta });

        // Save JSON file
        if save_file {
            let file_path = self.raw_dir.join(format!("{}_{}.json", route_no, route_id));
            fs::write(file_path, serde_json::to_string_pretty(&stops)?)?;
        }

        Ok(Some(RouteData {
            route_id,
            route_no,
            details,
            stops_map: stops_map_data,
        }))
    }

    /// Reads raw stop JSON, generates a road-following polyline via OSRM, and exports GeoJSON.
    async fn snap_route_file(&self, path: &Path) -> Result<()> {
        let content = fs::read_to_string(path)?;
        let stops: Vec<Stop> = serde_json::from_str(&content)?;

        // Preprocess: Sanitize stop locations to main corridor
        // Mitigates alley/service-road deviations caused by poor stop coordinates.
        let mut stops = stops;
        self.sanitize_stops_to_corridor(&mut stops).await;

        if stops.len() < 2 {
            return Ok(());
        }

        // Logic 1: Identify Turning Point (where direction changes)
        let mut turning_point_idx = stops.len() - 1;
        for i in 0..stops.len() - 1 {
            if stops[i].up_down_cd != stops[i + 1].up_down_cd {
                turning_point_idx = i;
                break;
            }
        }

        // Logic 2: Chunk Processing for OSRM (Respects URL length limits)
        let mut final_features = Vec::new();
        let mut start_idx = 0;

        while start_idx < stops.len() - 1 {
            let end_idx = (start_idx + OSRM_CHUNK_SIZE).min(stops.len());
            let chunk = &stops[start_idx..end_idx];

            if chunk.len() < 2 {
                break;
            }

            // Fetch route geometry from OSRM
            if let Some(coords) = self.fetch_osrm_route(chunk).await {
                let is_past_turning_point = start_idx > turning_point_idx;
                let direction_val = if is_past_turning_point { 1 } else { 0 };

                let contains_tp = (start_idx..end_idx).contains(&turning_point_idx);

                final_features.push(json!({
                "type": "Feature",
                "properties": {
                "direction": direction_val,
                "is_turning_point": contains_tp,
                "start_node_ord": chunk[0].node_ord
                },
                "geometry": {
                "type": "LineString",
                "coordinates": coords
                }
                }));
            }

            // Overlap by 1 point to ensure visual continuity between chunks
            start_idx = end_idx - 1;
        }

        // Save result as GeoJSON
        // Input: {ROUTE_NAME}_{ROUTE_ID}.json -> Output: {ROUTE_ID}.geojson
        let file_name = path.file_name().unwrap().to_string_lossy();
        let clean_name = file_name
            .splitn(2, '_')
            .nth(1)
            .unwrap_or(&file_name)
            .replace(".json", ".geojson");
        let output_path = self.snapped_dir.join(clean_name);

        fs::write(
            output_path,
            serde_json::to_string_pretty(&json!({
            "type": "FeatureCollection",
            "features": final_features
            }))?,
        )?;

        Ok(())
    }

    /// Snaps "off-road" stops onto the direct corridor between the previous and next stops.
    /// Used to correct GPS drift or stops placed on side service roads.
    async fn sanitize_stops_to_corridor(&self, stops: &mut [Stop]) {
        if stops.len() < 3 {
            return;
        }

        // Thresholds (tunable)
        let snap_if_within_m = 90.0; // If stop is this close to corridor, snap it.
        let do_not_move_if_far_m = 250.0; // If stop is too far, assume it's a real deviation.

        for i in 1..stops.len() - 1 {
            let prev = stops[i - 1].clone();
            let next = stops[i + 1].clone();

            // Calculate corridor between Prev and Next
            let corridor = match self.fetch_osrm_route_between(&prev, &next).await {
                Some(c) => c,
                None => continue,
            };

            let p = (stops[i].gps_long, stops[i].gps_lat);
            let Some(((cx, cy), dist_m)) = closest_point_on_polyline(p, &corridor) else {
                continue;
            };

            // Heuristic: Snap only if plausibly on the same main road
            if dist_m <= snap_if_within_m {
                stops[i].gps_long = cx;
                stops[i].gps_lat = cy;
            } else if dist_m > do_not_move_if_far_m {
                // Keep original coordinates (likely a true branch deviation)
            }
        }
    }

    /// Calculates a 2-point corridor route between two stops (prev <-> next).
    async fn fetch_osrm_route_between(&self, a: &Stop, b: &Stop) -> Option<Vec<Vec<f64>>> {
        if !(a.gps_lat > 30.0 && a.gps_long > 120.0 && b.gps_lat > 30.0 && b.gps_long > 120.0) {
            return None;
        }

        let coords_param = format!(
            "{:.6},{:.6};{:.6},{:.6}",
            a.gps_long, a.gps_lat, b.gps_long, b.gps_lat
        );

        let base = if self.osrm_base_url.contains("/route/v1/driving") {
            self.osrm_base_url.clone()
        } else {
            self.osrm_base_url
                .replace("/match/v1/driving", "/route/v1/driving")
        };

        let url = format!(
            "{base}/{coords}?overview=full&geometries=geojson&steps=false&continue_straight=true",
            base = base,
            coords = coords_param
        );

        let resp = reqwest::get(&url).await.ok()?;
        if !resp.status().is_success() {
            return None;
        }

        let json: Value = resp.json().await.ok()?;
        if json["code"] != "Ok" {
            return None;
        }

        let routes = json["routes"].as_array()?;
        let geom = routes
            .get(0)?
            .get("geometry")?
            .get("coordinates")?
            .as_array()?;
        let coords: Vec<Vec<f64>> = serde_json::from_value(Value::Array(geom.clone())).ok()?;
        if coords.is_empty() {
            None
        } else {
            Some(coords)
        }
    }

    /// Generates a road-following polyline using OSRM /route.
    /// Preferred over /match for sparse inputs (e.g., bus stops) to ensure clean linear paths.
    async fn fetch_osrm_route(&self, stops: &[Stop]) -> Option<Vec<Vec<f64>>> {
        // Filter out invalid coordinates
        let stops_filtered: Vec<&Stop> = stops
            .iter()
            .filter(|s| s.gps_lat > 30.0 && s.gps_long > 120.0)
            .collect();

        if stops_filtered.len() < 2 {
            return None;
        }

        // Build coordinate parameter: "lon,lat;lon,lat;..."
        let coords_param = stops_filtered
            .iter()
            .map(|s| format!("{:.6},{:.6}", s.gps_long, s.gps_lat))
            .collect::<Vec<_>>()
            .join(";");

        // Normalize URL to use /route/v1/driving
        let base = if self.osrm_base_url.contains("/route/v1/driving") {
            self.osrm_base_url.clone()
        } else {
            self.osrm_base_url
                .replace("/match/v1/driving", "/route/v1/driving")
        };

        // Parameters:
        // - overview=full: Retain full polyline fidelity
        // - geometries=geojson: Return coordinates array
        // - steps=false: Disable turn-by-turn instructions
        // - continue_straight=true: Minimize unnecessary detours at intersections
        let final_url = format!(
            "{base}/{coords}?overview=full&geometries=geojson&steps=false&continue_straight=true",
            base = base,
            coords = coords_param
        );

        match reqwest::get(&final_url).await {
            Ok(resp) => {
                if !resp.status().is_success() {
                    // Fallback to straight-line connection if OSRM fails
                    return Some(
                        stops_filtered
                            .iter()
                            .map(|s| vec![s.gps_long, s.gps_lat])
                            .collect(),
                    );
                }

                let json: Value = match resp.json().await {
                    Ok(v) => v,
                    Err(_) => {
                        return Some(
                            stops_filtered
                                .iter()
                                .map(|s| vec![s.gps_long, s.gps_lat])
                                .collect(),
                        );
                    }
                };

                if json["code"] == "Ok" {
                    if let Some(routes) = json["routes"].as_array() {
                        if let Some(geom) = routes
                            .get(0)
                            .and_then(|r| r["geometry"]["coordinates"].as_array())
                        {
                            let coords: Vec<Vec<f64>> =
                                serde_json::from_value(Value::Array(geom.clone()))
                                    .unwrap_or_default();
                            if !coords.is_empty() {
                                return Some(coords);
                            }
                        }
                    }
                }
            }
            Err(e) => eprintln!(" ! Net Error: {}", e),
        }

        // Final fallback: raw stop coordinates (straight lines)
        Some(
            stops_filtered
                .iter()
                .map(|s| vec![s.gps_long, s.gps_lat])
                .collect(),
        )
    }

    fn save_route_map_json(
        &self,
        map: &BTreeMap<String, Vec<String>>,
        details: &HashMap<String, Value>,
        stops: &BTreeMap<String, Value>,
    ) -> Result<()> {
        let final_data = json!({
        "lastUpdated": Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        "route_numbers": map,
        "route_details": details,
        "stations": stops
        });
        fs::write(
            &self.mapping_file,
            serde_json::to_string_pretty(&final_data)?,
        )?;
        Ok(())
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

fn resolve_url(key: &str, default: &str) -> String {
    let v = utils::get_env(key);
    if v.is_empty() { default.to_string() } else { v }
}

/// Handles API quirk where 'items' can be an Array, Object, or Null.
fn extract_items(json: &Value) -> Result<Vec<Value>> {
    let items = &json["response"]["body"]["items"]["item"];
    if let Some(arr) = items.as_array() {
        Ok(arr.clone())
    } else if let Some(obj) = items.as_object() {
        Ok(vec![Value::Object(obj.clone())])
    } else {
        Ok(vec![])
    }
}

/// Robustness wrapper to parse strings/numbers from flexible JSON fields.
fn parse_flexible_string(v: &Value) -> String {
    if let Some(s) = v.as_str() {
        s.to_string()
    } else if let Some(n) = v.as_i64() {
        n.to_string()
    } else {
        "UNKNOWN".to_string()
    }
}

fn meters_between(lon1: f64, lat1: f64, lon2: f64, lat2: f64) -> f64 {
    // Fast Haversine approximation (sufficient for short distances)
    let r = 6371000.0;
    let x = (lon2 - lon1).to_radians() * ((lat1 + lat2) * 0.5).to_radians().cos();
    let y = (lat2 - lat1).to_radians();
    (x * x + y * y).sqrt() * r
}

/// Returns the closest point (lon, lat) on a polyline and its distance in meters.
fn closest_point_on_polyline(point: (f64, f64), line: &Vec<Vec<f64>>) -> Option<((f64, f64), f64)> {
    if line.len() < 2 {
        return None;
    }

    let (px, py) = point;

    let mut best = None::<((f64, f64), f64)>;

    for seg in line.windows(2) {
        let (x1, y1) = (seg[0][0], seg[0][1]);
        let (x2, y2) = (seg[1][0], seg[1][1]);

        // Project P onto segment AB in lon/lat space (approximate)
        let dx = x2 - x1;
        let dy = y2 - y1;
        let denom = dx * dx + dy * dy;
        if denom == 0.0 {
            continue;
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / denom;
        let t = t.clamp(0.0, 1.0);

        let cx = x1 + t * dx;
        let cy = y1 + t * dy;

        let d = meters_between(px, py, cx, cy);

        match best {
            None => best = Some(((cx, cy), d)),
            Some((_, bd)) if d < bd => best = Some(((cx, cy), d)),
            _ => {}
        }
    }

    best
}
