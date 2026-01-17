// src/route/mod.rs

use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result};
use chrono::Local;
use futures::stream::{self, StreamExt};
use serde_json::{Value, json};
use tokio::time::sleep;

use super::utils;

// Default constants if env vars are missing
const TAGO_URL: &str = "http://apis.data.go.kr/1613000/BusRouteInfoInqireService";
const OSRM_URL: &str = "http://router.project-osrm.org/route/v1/driving";

/// Holds data collected from a single route processing task
struct RouteData {
    route_id: String,
    route_no: String,
    details: Value,
    stops: Vec<(String, Value)>, // (node_id, node_data)
}

pub async fn run(
    city_code: String,
    specific_route: Option<String>,
    output_dir: PathBuf,
    station_map_only: bool,
    osrm_only: bool,
) -> Result<()> {
    // Validate API Key
    let service_key = utils::get_env("DATA_GO_KR_SERVICE_KEY");
    if service_key.is_empty() {
        anyhow::bail!("DATA_GO_KR_SERVICE_KEY is not set in .env");
    }

    // Setup directories
    let raw_dir = output_dir.join("raw_routes");
    let snapped_dir = output_dir.join("snapped_routes");

    utils::ensure_dir(&raw_dir)?;
    utils::ensure_dir(&snapped_dir)?;

    // Initialize Processor (wrapped in Arc for thread safety in async blocks)
    let processor = Arc::new(BusRouteProcessor {
        service_key,
        city_code,
        raw_dir: raw_dir.clone(),
        snapped_dir: snapped_dir.clone(),
        mapping_file: output_dir.join("routeMap.json"),
        tago_base_url: resolve_url("TAGO_API_URL", TAGO_URL),
        osrm_base_url: resolve_url("OSRM_ROUTE_API_URL", OSRM_URL),
    });

    // Phase 1: Data Collection
    if !osrm_only {
        println!("\n[Phase 1: Data Collection]");

        let routes = processor.get_all_routes().await?;

        // Filter target routes
        let targets: Vec<Value> = if let Some(target_no) = specific_route.as_ref() {
            routes
                .into_iter()
                .filter(|r| parse_flexible_string(&r["routeno"]) == *target_no)
                .collect()
        } else {
            routes
        };

        println!("  Targeting {} routes...", targets.len());

        // Concurrent Processing Configuration
        let concurrency_limit = 5; // Adjust based on API rate limits
        let mut route_stream = stream::iter(targets)
            .map(|route| {
                let proc = Arc::clone(&processor);
                async move { proc.process_single_route(route, !station_map_only).await }
            })
            .buffer_unordered(concurrency_limit);

        // Aggregation structures
        let mut all_stops = BTreeMap::new();
        let mut route_details_map = HashMap::new();
        let mut route_mapping: BTreeMap<String, Vec<String>> = BTreeMap::new();

        let mut count = 0;

        while let Some(result) = route_stream.next().await {
            count += 1;
            match result {
                Ok(Some(data)) => {
                    // Update aggregations
                    route_details_map.insert(data.route_id.clone(), data.details);
                    route_mapping
                        .entry(data.route_no)
                        .or_default()
                        .push(data.route_id);

                    for (id, val) in data.stops {
                        all_stops.insert(id, val);
                    }
                    if count % 10 == 0 {
                        println!("  ... Processed {} routes", count);
                    }
                }
                Ok(None) => {} // Skipped route
                Err(e) => eprintln!("  Error processing route: {:?}", e),
            }
        }

        // Save metadata map
        processor.save_route_map_json(&route_mapping, &route_details_map, &all_stops)?;

        if station_map_only {
            println!("✓ Station map only mode completed.");
            return Ok(());
        }
    }

    // Phase 2: OSRM Snapping
    println!("\n[Phase 2: Route Snapping via OSRM]");

    let entries: Vec<_> = fs::read_dir(&raw_dir)?
        .filter_map(|e| e.ok()) // Ignore entries with errors
        .collect();

    // Set concurrency for snapping
    let snap_concurrency = 5;

    let mut snap_stream = stream::iter(entries)
        .map(|entry| {
            let proc = Arc::clone(&processor);
            let specific = specific_route.clone();

            async move {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext == "geojson") {
                    let file_name = path.file_name().unwrap().to_string_lossy();

                    if let Some(ref target) = specific {
                        if !file_name.contains(target) {
                            return Ok(());
                        }
                    }

                    println!("  Snapping {}...", file_name);
                    proc.snap_route_file(&path).await
                } else {
                    Ok(())
                }
            }
        })
        .buffer_unordered(snap_concurrency);

    while let Some(result) = snap_stream.next().await {
        if let Err(e) = result {
            eprintln!("  Snap error: {:?}", e);
        }
    }

    println!("✓ All done!");

    Ok(())
}

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
    /// Fetch the list of all routes for the city
    async fn get_all_routes(&self) -> Result<Vec<Value>> {
        let params = [
            ("cityCode", self.city_code.as_str()),
            ("numOfRows", "1024"),
            ("pageNo", "1"),
            ("serviceKey", self.service_key.as_str()),
            ("_type", "json"),
        ];

        let url = format!("{}/getRouteNoList", self.tago_base_url);
        let resp = reqwest::Client::new()
            .get(&url)
            .query(&params)
            .send()
            .await
            .context("Failed to fetch route list")?;

        let json: Value = resp.json().await?;
        extract_items(&json)
    }

    /// Process a single route: fetch stops, build GeoJSON, and return metadata
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

        if route_no.is_empty() || route_no == "UNKNOWN" || route_id.is_empty() {
            return Ok(None);
        }

        // Fetch stops for this route
        let params = [
            ("cityCode", self.city_code.as_str()),
            ("routeId", route_id.as_str()),
            ("numOfRows", "1024"),
            ("serviceKey", self.service_key.as_str()),
            ("_type", "json"),
        ];

        let url = format!("{}/getRouteAcctoThrghSttnList", self.tago_base_url);
        let resp = reqwest::Client::new()
            .get(&url)
            .query(&params)
            .send()
            .await?;

        // Handle potential JSON errors gracefully
        let json: Value = match resp.json().await {
            Ok(v) => v,
            Err(_) => return Ok(None),
        };

        let mut items = extract_items(&json)?;
        if items.is_empty() {
            return Ok(None);
        }

        // Sort by node order to ensure correct sequence
        items.sort_by_key(|v| v["nodeord"].as_i64().unwrap_or(0));

        let mut sequence = Vec::new();
        let mut stops_data = Vec::new();

        // Process stops
        for item in &items {
            let node_id = item["nodeid"].as_str().unwrap_or("");
            if node_id.is_empty() {
                continue;
            }

            // Collect stop metadata
            stops_data.push((
                node_id.to_string(),
                json!({
                   "nodenm": item["nodenm"],
                   "nodeno": item["nodeno"],
                   "gpslati": item["gpslati"],
                   "gpslong": item["gpslong"]
                }),
            ));

            sequence.push(json!({
                "nodeid": node_id,
                "nodeord": item["nodeord"],
                "updowncd": item["updowncd"]
            }));
        }

        let route_detail_obj = json!({
            "routeno": route_no,
            "sequence": sequence
        });

        // If we don't need to save the GeoJSON file, return early
        if !save_file {
            return Ok(Some(RouteData {
                route_id,
                route_no,
                details: route_detail_obj,
                stops: stops_data,
            }));
        }

        // Build GeoJSON features
        let features = self.build_geojson_features(&items);
        if features.is_empty() {
            return Ok(None);
        }

        let geojson = json!({
            "type": "FeatureCollection",
            "features": features
        });

        // Save Raw GeoJSON
        let file_path = self
            .raw_dir
            .join(format!("{}_{}.geojson", route_no, route_id));
        fs::write(file_path, serde_json::to_string_pretty(&geojson)?)?;

        Ok(Some(RouteData {
            route_id,
            route_no,
            details: route_detail_obj,
            stops: stops_data,
        }))
    }

    /// Helper to separate UP and DOWN lines and create LineStrings
    fn build_geojson_features(&self, items: &[Value]) -> Vec<Value> {
        let extract_coords = |target_updown: i64| -> Vec<Vec<f64>> {
            items
                .iter()
                .filter(|i| {
                    let val = &i["updowncd"];
                    // API might return "0"/"1" string or 0/1 integer
                    let val_int = if let Some(s) = val.as_str() {
                        s.parse::<i64>().unwrap_or(-1)
                    } else {
                        val.as_i64().unwrap_or(-1)
                    };
                    val_int == target_updown
                })
                .map(|i| {
                    vec![
                        i["gpslong"].as_f64().unwrap_or(0.0),
                        i["gpslati"].as_f64().unwrap_or(0.0),
                    ]
                })
                .collect()
        };

        // 0: Down (usually), 1: Up (usually). Sometimes reversed depending on city.
        let up_coords = extract_coords(1);
        let down_coords = extract_coords(0);

        let mut features = Vec::new();

        if !up_coords.is_empty() {
            features.push(json!({
                "type": "Feature",
                "properties": {"dir": "up"},
                "geometry": {"type": "LineString", "coordinates": up_coords}
            }));
        }
        if !down_coords.is_empty() {
            features.push(json!({
                "type": "Feature",
                "properties": {"dir": "down"},
                "geometry": {"type": "LineString", "coordinates": down_coords}
            }));
        }
        features
    }

    /// Saves the Master JSON file containing all metadata
    fn save_route_map_json(
        &self,
        route_mapping: &BTreeMap<String, Vec<String>>,
        route_details: &HashMap<String, Value>,
        all_stops: &BTreeMap<String, Value>,
    ) -> Result<()> {
        let final_data = json!({
            "lastUpdated": Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            "route_numbers": route_mapping,
            "route_details": route_details,
            "stations": all_stops
        });

        fs::write(
            &self.mapping_file,
            serde_json::to_string_pretty(&final_data)?,
        )?;
        println!("  ✓ Saved routeMap.json");
        Ok(())
    }

    async fn snap_route_file(&self, path: &Path) -> Result<()> {
        let content = fs::read_to_string(path)?;
        let mut geojson: Value = serde_json::from_str(&content)?;
        let features = geojson["features"]
            .as_array_mut()
            .context("No features found")?;

        let mut new_features = Vec::new();

        for feature in features {
            let coords_val = &feature["geometry"]["coordinates"];
            let raw_coords: Vec<Vec<f64>> = serde_json::from_value(coords_val.clone())?;

            if raw_coords.len() < 2 {
                continue;
            }

            let snapped = self.fetch_osrm_match(&raw_coords).await;

            new_features.push(json!({
                "type": "Feature",
                "properties": feature["properties"],
                "geometry": {
                    "type": "LineString",
                    "coordinates": snapped
                }
            }));
        }

        // Clean filename (e.g., "100_ROUTEID.geojson" -> "ROUTEID.geojson")
        let file_name = path.file_name().unwrap().to_string_lossy();
        let clean_name = if file_name.contains('_') {
            file_name.splitn(2, '_').last().unwrap()
        } else {
            &file_name
        };

        let output_path = self.snapped_dir.join(clean_name);
        let final_json = json!({
            "type": "FeatureCollection",
            "features": new_features
        });

        fs::write(output_path, serde_json::to_string_pretty(&final_json)?)?;
        Ok(())
    }

    /// Breaks coordinates into chunks and queries OSRM
    async fn fetch_osrm_match(&self, coords: &[Vec<f64>]) -> Vec<Vec<f64>> {
        let chunk_size = 80; // OSRM default limit is often ~100, keeping it safe
        let mut final_coords = Vec::new();

        // Iterate over chunks
        for (i, chunk) in coords.chunks(chunk_size).enumerate() {
            if chunk.len() < 2 {
                continue;
            }

            // OSRM format: lon,lat;lon,lat
            let coord_str = chunk
                .iter()
                .map(|c| format!("{:.6},{:.6}", c[0], c[1]))
                .collect::<Vec<_>>()
                .join(";");

            let url = format!(
                "{}/{}?overview=full&geometries=geojson",
                self.osrm_base_url, coord_str
            );

            // Fetch from OSRM
            match reqwest::get(&url).await {
                Ok(resp) => {
                    let mut success = false;
                    if let Ok(json) = resp.json::<Value>().await {
                        if json["code"] == "Ok" {
                            if let Some(routes) = json["routes"].as_array() {
                                if let Some(geom) = routes[0]["geometry"]["coordinates"].as_array()
                                {
                                    let snapped: Vec<Vec<f64>> =
                                        serde_json::from_value(Value::Array(geom.clone()))
                                            .unwrap_or_default();

                                    // Avoid point duplication between chunks
                                    if i > 0 && !snapped.is_empty() {
                                        final_coords.extend(snapped.into_iter().skip(1));
                                    } else {
                                        final_coords.extend(snapped);
                                    }
                                    success = true;
                                }
                            }
                        }
                    }
                    // Fallback to raw coords if OSRM failed
                    if !success {
                        if i > 0 {
                            final_coords.extend(chunk.to_vec().into_iter().skip(1));
                        } else {
                            final_coords.extend(chunk.to_vec());
                        }
                    }
                }
                Err(_) => {
                    // Fallback on network error
                    if i > 0 {
                        final_coords.extend(chunk.to_vec().into_iter().skip(1));
                    } else {
                        final_coords.extend(chunk.to_vec());
                    }
                }
            }

            // Be polite to the OSRM server especially if using public OSRM instance
            // In my case, I use local OSRM, so this can be adjusted as needed
            sleep(Duration::from_millis(10)).await;
        }

        final_coords
    }
}

// Helper Functions

/// Resolves environment variables with a fallback
fn resolve_url(env_key: &str, default: &str) -> String {
    let val = utils::get_env(env_key);
    if val.is_empty() {
        default.to_string()
    } else {
        val
    }
}

/// Handles the API's quirk where 'items' is an Object (single result) or Array (multiple)
fn extract_items(json: &Value) -> Result<Vec<Value>> {
    let body = &json["response"]["body"];
    let items_node = &body["items"]["item"];

    if let Some(arr) = items_node.as_array() {
        Ok(arr.clone())
    } else if let Some(obj) = items_node.as_object() {
        Ok(vec![Value::Object(obj.clone())])
    } else {
        // If items is null or empty string, return empty vector
        Ok(vec![])
    }
}

/// Robustly extracts a string from a JSON Value (handles String, Int, Float)
fn parse_flexible_string(v: &Value) -> String {
    if let Some(s) = v.as_str() {
        s.to_string()
    } else if let Some(n) = v.as_i64() {
        n.to_string()
    } else if let Some(f) = v.as_f64() {
        f.to_string()
    } else {
        "UNKNOWN".to_string()
    }
}
