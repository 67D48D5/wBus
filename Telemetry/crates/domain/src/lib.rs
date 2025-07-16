// crates/domain/src/lib.rs

use anyhow::Result;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// Custom Types for Type Safety

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub struct RouteId(pub String);

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub struct BusStopId(pub String);

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Hash)]
pub struct CityId(pub u8);

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq)]
pub struct Coordinates {
    pub latitude: f64,
    pub longitude: f64,
}

pub type Polyline = Vec<Coordinates>;

// Domain Models (Aggregates & Entities)

/// Represents a static bus route with its path.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusRoute {
    pub id: RouteId,
    pub city_id: CityId,
    pub name: String,
    pub polyline: Polyline,
}

/// Represents a physical bus stop.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusStop {
    pub id: BusStopId,
    pub city_id: CityId,
    pub name: String,
    pub coordinates: Coordinates,
}

/// Represents a single, real-time bus vehicle on a route.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bus {
    pub id: String, // Vehicle-specific ID, e.g., license plate
    pub route_id: RouteId,
    pub city_id: CityId,
    pub coordinates: Coordinates,
}

/// Represents the upcoming arrival of a specific bus at a specific stop.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusArrival {
    pub stop_id: BusStopId,
    pub route_id: RouteId,
    pub vehicle_id: String, // Which specific bus is arriving
    pub arrival_time: DateTime<Utc>,
}

// Repository Trait (Domain Contract)

/// Defines the contract for how the application layer interacts with data persistence.
/// This trait is implemented in the `infrastructure` crate.
#[async_trait]
pub trait BusRepository: Send + Sync {
    // Methods for static data
    async fn find_route_by_bus(&self, route_id: &RouteId) -> Result<Option<BusRoute>>;
    async fn find_all_route_by_city(&self, city_id: CityId) -> Result<Vec<BusRoute>>;
    async fn find_all_stop_by_city(&self, city_id: CityId) -> Result<Vec<BusStop>>;

    // Methods for real-time data
    async fn find_all_bus_by_city(&self, city_id: CityId) -> Result<Vec<Bus>>;
    async fn find_all_bus_by_route(&self, city_id: CityId, route_id: &RouteId) -> Result<Vec<Bus>>;
    async fn find_arrival_by_stop(
        &self,
        city_id: CityId,
        stop_id: &BusStopId,
    ) -> Result<Vec<BusArrival>>;

    // Methods for saving/updating data
    async fn save_bus_route(&self, routes: Vec<BusRoute>) -> Result<()>;
    async fn save_bus_stop(&self, stops: Vec<BusStop>) -> Result<()>;
    async fn save_realtime_bus(&self, buses: Vec<Bus>) -> Result<()>;
    async fn save_realtime_arrival(&self, arrivals: Vec<BusArrival>) -> Result<()>;
}
