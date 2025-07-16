// crates/application/src/lib.rs

use anyhow::Result;
use domain::{
    Bus, BusArrival, BusRepository, BusRoute, BusStop, BusStopId, CityId, Polyline, RouteId,
};
use std::sync::Arc;

// Use Cases (Application Services)

/// A use case for fetching all bus routes in a given city.
pub struct GetRoutesByCity {
    repo: Arc<dyn BusRepository>,
}

impl GetRoutesByCity {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, city_id: CityId) -> Result<Vec<BusRoute>> {
        self.repo.find_all_route_by_city(city_id).await
    }
}

/// A use case for fetching all bus stops in a given city.
pub struct GetBusStopLocationByCity {
    repo: Arc<dyn BusRepository>,
}

impl GetBusStopLocationByCity {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, city_id: CityId) -> Result<Vec<BusStop>> {
        self.repo.find_all_stop_by_city(city_id).await
    }
}

/// A use case for fetching the polyline for a specific route.
pub struct GetPolylineByRoute {
    repo: Arc<dyn BusRepository>,
}

impl GetPolylineByRoute {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, route_id: &RouteId) -> Result<Option<Polyline>> {
        // This logic lives in the application layer: find the route, then extract the polyline.
        let route = self.repo.find_route_by_bus(route_id).await?;
        Ok(route.map(|r| r.polyline))
    }
}

/// A use case for fetching real-time bus locations for a whole city.
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

/// A use case for fetching real-time bus locations for a specific route.
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

/// A use case for fetching arrival predictions for a specific bus stop.
pub struct GetArrivalByBusStop {
    repo: Arc<dyn BusRepository>,
}

impl GetArrivalByBusStop {
    pub fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, city_id: CityId, stop_id: &BusStopId) -> Result<Vec<BusArrival>> {
        self.repo.find_arrival_by_stop(city_id, stop_id).await
    }
}
