// src/route/mod.rs

use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

use anyhow::{Context, Result};
use chrono::Local;
use serde_json::{Value, json};
use tokio::time::sleep;

use super::utils;

const TAGO_URL: &str = "http://apis.data.go.kr/1613000/BusRouteInfoInqireService";
const OSRM_URL: &str = "http://router.project-osrm.org/route/v1/driving";

pub async fn run(
    city_code: String,
    specific_route: Option<String>,
    output_dir: PathBuf,
    station_map_only: bool,
) -> Result<()> {
    let service_key = utils::get_env("DATA_GO_KR_SERVICE_KEY");
    if service_key.is_empty() {
        anyhow::bail!("DATA_GO_KR_SERVICE_KEY is not set in .env");
    }

    let raw_dir = output_dir.join("raw_routes");
    let snapped_dir = output_dir.join("snapped_routes");
    utils::ensure_dir(&raw_dir)?;
    utils::ensure_dir(&snapped_dir)?;

    let mut processor = BusRouteProcessor {
        service_key,
        city_code,
        raw_dir,
        snapped_dir,
        mapping_file: output_dir.join("routeMap.json"),
        all_stops: BTreeMap::new(),
        route_details: HashMap::new(),
        tago_base_url: utils::get_env("TAGO_API_URL")
            .is_empty()
            .then(|| TAGO_URL.to_string())
            .unwrap_or(utils::get_env("TAGO_API_URL")),
        osrm_base_url: utils::get_env("OSRM_ROUTE_API_URL")
            .is_empty()
            .then(|| OSRM_URL.to_string())
            .unwrap_or(utils::get_env("OSRM_ROUTE_API_URL")),
    };

    println!("\n[Phase 1: Data Collection]");
    let routes = processor.get_all_routes().await?;

    // Filter routes
    let targets: Vec<Value> = if let Some(target_no) = specific_route.as_ref() {
        routes
            .into_iter()
            .filter(|r| {
                // Try as string first, then as i64 and convert to string if necessary
                let r_no = if let Some(s) = r["routeno"].as_str() {
                    s.to_string()
                } else if let Some(n) = r["routeno"].as_i64() {
                    n.to_string()
                } else {
                    String::new()
                };

                &r_no == target_no
            })
            .collect()
    } else {
        routes
    };

    println!("  Targeting {} routes...", targets.len());

    for (i, route) in targets.iter().enumerate() {
        let route_id = route["routeid"].as_str().unwrap_or_default();
        let route_no = if let Some(s) = route["routeno"].as_str() {
            s.to_string()
        } else if let Some(n) = route["routeno"].as_i64() {
            n.to_string()
        } else if let Some(f) = route["routeno"].as_f64() {
            f.to_string() // Handle float case
        } else {
            "UNKNOWN".to_string() // Fallback
        };

        println!(
            "  [{}/{}] Processing Route {}...",
            i + 1,
            targets.len(),
            route_no
        );

        // If "UNKNOWN" or route_id is empty, skip processing
        if route_no == "UNKNOWN" || route_id.is_empty() {
            println!("    Warning: Skipping invalid route data.");
            continue;
        }

        processor
            .save_route_geojson(route_id, &route_no, !station_map_only)
            .await?;
        sleep(Duration::from_millis(300)).await;
    }

    processor.save_route_map_json(&targets)?;

    if station_map_only {
        println!("✓ Station map only mode completed.");
        return Ok(());
    }

    println!("\n[Phase 2: Route Snapping via OSRM]");
    // Snapping Logic
    let files = fs::read_dir(&processor.raw_dir)?;
    for entry in files {
        let entry = entry?;
        let path = entry.path();
        if path.extension().map_or(false, |ext| ext == "geojson") {
            let file_name = path.file_name().unwrap().to_string_lossy();
            if let Some(ref target) = specific_route {
                if !file_name.contains(target) {
                    continue;
                }
            }

            println!("  Snapping {}...", file_name);
            processor.snap_route_file(&path).await?;
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
    all_stops: BTreeMap<String, Value>,
    route_details: HashMap<String, Value>,
    tago_base_url: String,
    osrm_base_url: String,
}

impl BusRouteProcessor {
    async fn get_all_routes(&mut self) -> Result<Vec<Value>> {
        let params = [
            ("cityCode", self.city_code.as_str()),
            ("numOfRows", "2000"),
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

        // API 응답 구조 파싱 (복잡한 구조 단순화)
        let json: Value = resp.json().await?;
        let items = json["response"]["body"]["items"]["item"].as_array();

        // 단일 객체일 경우 배열로 변환 처리 필요하나, Serde_json Value 처리가 유연함.
        // 여기서는 배열이라고 가정 (items가 null이면 빈 벡터)
        if let Some(arr) = items {
            Ok(arr.clone())
        } else if let Some(obj) = json["response"]["body"]["items"]["item"].as_object() {
            Ok(vec![Value::Object(obj.clone())])
        } else {
            Ok(vec![])
        }
    }

    async fn save_route_geojson(
        &mut self,
        route_id: &str,
        route_no: &str,
        save_file: bool,
    ) -> Result<()> {
        let params = [
            ("cityCode", self.city_code.as_str()),
            ("routeId", route_id),
            ("numOfRows", "500"),
            ("serviceKey", self.service_key.as_str()),
            ("_type", "json"),
        ];

        let url = format!("{}/getRouteAcctoThrghSttnList", self.tago_base_url);
        let resp = reqwest::Client::new()
            .get(&url)
            .query(&params)
            .send()
            .await?;
        let mut json: Value = match resp.json().await {
            Ok(v) => v,
            Err(_) => return Ok(()), // Skip on error
        };

        let items_opt = json["response"]["body"]["items"]["item"].as_array_mut();
        let mut items = if let Some(arr) = items_opt {
            arr.clone()
        } else if let Some(obj) = json["response"]["body"]["items"]["item"].as_object() {
            vec![Value::Object(obj.clone())]
        } else {
            return Ok(());
        };

        // Sort by nodeord
        items.sort_by_key(|v| v["nodeord"].as_i64().unwrap_or(0));

        let mut sequence = Vec::new();

        for item in &items {
            let node_id = item["nodeid"].as_str().unwrap_or("");
            if node_id.is_empty() {
                continue;
            }

            // Update Master Stops
            if !self.all_stops.contains_key(node_id) {
                self.all_stops.insert(
                    node_id.to_string(),
                    json!({
                       "nodenm": item["nodenm"],
                       "nodeno": item["nodeno"],
                       "gpslati": item["gpslati"],
                       "gpslong": item["gpslong"]
                    }),
                );
            }

            sequence.push(json!({
                "nodeid": node_id,
                "nodeord": item["nodeord"],
                "updowncd": item["updowncd"]
            }));
        }

        self.route_details.insert(
            route_id.to_string(),
            json!({
                "routeno": route_no,
                "sequence": sequence
            }),
        );

        if !save_file {
            return Ok(());
        }

        // GeoJSON Creation
        let up_coords: Vec<Vec<f64>> = items
            .iter()
            .filter(|i| {
                i["updowncd"].as_str().unwrap_or("0") == "1"
                    || i["updowncd"].as_i64().unwrap_or(0) == 1
            })
            .map(|i| {
                vec![
                    i["gpslong"].as_f64().unwrap_or(0.0),
                    i["gpslati"].as_f64().unwrap_or(0.0),
                ]
            })
            .collect();

        let down_coords: Vec<Vec<f64>> = items
            .iter()
            .filter(|i| {
                i["updowncd"].as_str().unwrap_or("0") == "0"
                    || i["updowncd"].as_i64().unwrap_or(1) == 0
            })
            .map(|i| {
                vec![
                    i["gpslong"].as_f64().unwrap_or(0.0),
                    i["gpslati"].as_f64().unwrap_or(0.0),
                ]
            })
            .collect();

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

        if features.is_empty() {
            return Ok(());
        }

        let geojson = json!({
            "type": "FeatureCollection",
            "features": features
        });

        let file_path = self
            .raw_dir
            .join(format!("{}_{}.geojson", route_no, route_id));
        fs::write(file_path, serde_json::to_string_pretty(&geojson)?)?;

        Ok(())
    }

    fn save_route_map_json(&self, routes_list: &[Value]) -> Result<()> {
        let mut route_mapping: BTreeMap<String, Vec<String>> = BTreeMap::new();

        for r in routes_list {
            // [수정 3] 매핑 파일 저장 시에도 동일한 추출 로직 적용
            let no = if let Some(s) = r["routeno"].as_str() {
                s.to_string()
            } else if let Some(n) = r["routeno"].as_i64() {
                n.to_string()
            } else {
                "UNKNOWN".to_string()
            };

            if no == "UNKNOWN" {
                continue;
            }

            let rid = r["routeid"].as_str().unwrap_or("").to_string();
            route_mapping.entry(no).or_default().push(rid);
        }

        let final_data = json!({
            "lastUpdated": Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            "route_numbers": route_mapping,
            "route_details": self.route_details,
            "stations": self.all_stops
        });

        fs::write(
            &self.mapping_file,
            serde_json::to_string_pretty(&final_data)?,
        )?;
        println!("  ✓ Saved routeMap.json");
        Ok(())
    }

    async fn snap_route_file(&self, path: &PathBuf) -> Result<()> {
        let content = fs::read_to_string(path)?;
        let mut geojson: Value = serde_json::from_str(&content)?;
        let features = geojson["features"].as_array_mut().context("No features")?;

        let mut new_features = Vec::new();

        for feature in features {
            let coords_val = &feature["geometry"]["coordinates"];
            let raw_coords: Vec<Vec<f64>> = serde_json::from_value(coords_val.clone())?;

            let snapped = self.process_route_safely(&raw_coords).await;

            new_features.push(json!({
                "type": "Feature",
                "properties": feature["properties"],
                "geometry": {
                    "type": "LineString",
                    "coordinates": snapped
                }
            }));
        }

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

        // Merge if exists logic omitted for brevity, overwriting instead
        fs::write(output_path, serde_json::to_string_pretty(&final_json)?)?;
        Ok(())
    }

    async fn process_route_safely(&self, coords: &[Vec<f64>]) -> Vec<Vec<f64>> {
        let chunk_size = 40;
        let mut final_coords = Vec::new();

        for chunk in coords.chunks(chunk_size) {
            if chunk.len() < 2 {
                continue;
            }

            // OSRM expects: {lon},{lat};{lon},{lat}
            let coord_str = chunk
                .iter()
                .map(|c| format!("{:.6},{:.6}", c[0], c[1]))
                .collect::<Vec<_>>()
                .join(";");

            let url = format!(
                "{}/{}?overview=full&geometries=geojson",
                self.osrm_base_url, coord_str
            );

            match reqwest::get(&url).await {
                Ok(resp) => {
                    if let Ok(json) = resp.json::<Value>().await {
                        if json["code"] == "Ok" {
                            if let Some(routes) = json["routes"].as_array() {
                                if let Some(geom) = routes[0]["geometry"]["coordinates"].as_array()
                                {
                                    let snapped: Vec<Vec<f64>> =
                                        serde_json::from_value(Value::Array(geom.clone()))
                                            .unwrap_or_default();
                                    // OSRM overlaps points between chunks, could handle that, but simplistic append here
                                    final_coords.extend(snapped);
                                }
                            }
                        } else {
                            final_coords.extend(chunk.to_vec());
                        }
                    } else {
                        final_coords.extend(chunk.to_vec());
                    }
                }
                Err(_) => final_coords.extend(chunk.to_vec()),
            }
            sleep(Duration::from_secs(1)).await;
        }
        final_coords
    }
}
