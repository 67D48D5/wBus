// crates/domain/src/lib.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusRoute {
    pub id: u16,
    pub name: String,
    pub polyline: Vec<(f64, f64)>, // latitude, longitude pairs
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusObject {
    pub uuid: String,
    pub route_id: u16,
    pub city_id: u8,
    pub route_name: String,
    pub coordinates: (f64, f64), // latitude, longitude
    pub current_location: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusRoutePolyline {
    pub route_id: u16,
    pub city_id: u8,
    pub polyline: Vec<(f64, f64)>, // latitude, longitude pairs
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusStopObject {
    pub uuid: String,
    pub city_id: u8,
    pub name: String,
    pub coordinates: (f64, f64), // latitude, longitude
    pub arrival_info: String,
}
