// crates/application/src/lib.rs

use anyhow::Result;
use domain::{Bus, BusArrival, BusRepository, BusStop, BusStopId, CityId, Polyline, RouteId};
use std::sync::Arc;

// --- Use Cases (Application Services) ---

/// Use Case: Gets all bus stop locations for a given city.
pub struct GetBusStopLocationByCity {
    repo: Arc<dyn BusRepository>,
}

impl GetBusStopLocationByCity {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, city_id: CityId) -> Result<Vec<BusStop>> {
        self.repo.find_all_bus_stop_by_city(city_id).await
    }
}

/// Use Case: Gets arrival information for a specific bus stop.
pub struct GetArrivalByBusStop {
    repo: Arc<dyn BusRepository>,
}

impl GetArrivalByBusStop {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, city_id: CityId, stop_id: &BusStopId) -> Result<Vec<BusArrival>> {
        self.repo.find_arrival_by_bus_stop(city_id, stop_id).await
    }
}

/// Use Case: Gets the real-time location of all buses in a city.
pub struct GetBusLocationByCity {
    repo: Arc<dyn BusRepository>,
}

impl GetBusLocationByCity {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, city_id: CityId) -> Result<Vec<Bus>> {
        self.repo.find_all_bus_by_city(city_id).await
    }
}

/// Use Case: Gets the real-time location of all buses for a specific route.
pub struct GetBusLocationByRoute {
    repo: Arc<dyn BusRepository>,
}

impl GetBusLocationByRoute {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, city_id: CityId, route_id: &RouteId) -> Result<Vec<Bus>> {
        self.repo.find_all_bus_by_route(city_id, route_id).await
    }
}

/// Use Case: Gets the geographical path (polyline) for a specific bus route.
pub struct GetPolylineByRoute {
    repo: Arc<dyn BusRepository>,
}

impl GetPolylineByRoute {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, route_id: &RouteId) -> Result<Option<Polyline>> {
        let route = self.repo.find_route_by_bus(route_id).await?;
        Ok(route.map(|r| r.polyline))
    }
}
