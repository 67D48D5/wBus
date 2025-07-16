// crates/application/src/lib.rs

use anyhow::Result;
use domain::{BusArrivalInfo, BusInformationRepository, BusLocation, BusStopLocation, Polyline};
use std::sync::Arc;

//----------------------------------------------------------------
// Use Cases for Fetching Data
//----------------------------------------------------------------

/// Use Case: Gets all bus stop locations for a given city.
pub struct GetBusStopLocationByCity {
    repository: Arc<dyn BusInformationRepository>,
}

impl GetBusStopLocationByCity {
    pub fn new(repository: Arc<dyn BusInformationRepository>) -> Self {
        Self { repository }
    }

    /// Executes the use case.
    ///
    /// # Arguments
    /// * `city_id` - The unique identifier for the city.
    pub async fn execute(&self, city_id: u8) -> Result<Vec<BusStopLocation>> {
        self.repository.find_stops_by_city(city_id).await
    }
}

/// Use Case: Gets arrival information for a specific bus stop.
pub struct GetBusStopArrivalByCity {
    repository: Arc<dyn BusInformationRepository>,
}

impl GetBusStopArrivalByCity {
    pub fn new(repository: Arc<dyn BusInformationRepository>) -> Self {
        Self { repository }
    }

    /// Executes the use case.
    ///
    /// # Arguments
    /// * `city_id` - The unique identifier for the city.
    /// * `bus_stop_id` - The unique identifier for the bus stop.
    pub async fn execute(&self, city_id: u8, bus_stop_id: u16) -> Result<Vec<BusArrivalInfo>> {
        self.repository
            .find_arrival_info_by_stop(city_id, bus_stop_id)
            .await
    }
}

/// Use Case: Gets the real-time location of all buses in a city.
pub struct GetBusLocationByCity {
    repository: Arc<dyn BusInformationRepository>,
}

impl GetBusLocationByCity {
    pub fn new(repository: Arc<dyn BusInformationRepository>) -> Self {
        Self { repository }
    }

    /// Executes the use case.
    ///
    /// # Arguments
    /// * `city_id` - The unique identifier for the city.
    pub async fn execute(&self, city_id: u8) -> Result<Vec<BusLocation>> {
        self.repository.find_buses_by_city(city_id).await
    }
}

/// Use Case: Gets the real-time location of all buses for a specific route.
pub struct GetBusLocationByRoute {
    repository: Arc<dyn BusInformationRepository>,
}

impl GetBusLocationByRoute {
    pub fn new(repository: Arc<dyn BusInformationRepository>) -> Self {
        Self { repository }
    }

    /// Executes the use case.
    ///
    /// # Arguments
    /// * `city_id` - The unique identifier for the city.
    /// * `route_id` - The unique identifier for the bus route.
    pub async fn execute(&self, city_id: u8, route_id: u16) -> Result<Vec<BusLocation>> {
        self.repository.find_buses_by_route(city_id, route_id).await
    }
}

/// Use Case: Gets the geographical path (polyline) for a specific bus route.
pub struct GetBusPolylineByRoute {
    repository: Arc<dyn BusInformationRepository>,
}

impl GetBusPolylineByRoute {
    pub fn new(repository: Arc<dyn BusInformationRepository>) -> Self {
        Self { repository }
    }

    /// Executes the use case.
    ///
    /// # Arguments
    /// * `city_id` - The unique identifier for the city.
    /// * `route_id` - The unique identifier for the bus route.
    pub async fn execute(&self, city_id: u8, route_id: u16) -> Result<Polyline> {
        self.repository
            .find_polyline_by_route(city_id, route_id)
            .await
    }
}

//----------------------------------------------------------------
// Use Case for Updating Data
//----------------------------------------------------------------

/// Use Case: Triggers a full refresh of all data from the source.
pub struct UpdateData {
    repository: Arc<dyn BusInformationRepository>,
}

impl UpdateData {
    pub fn new(repository: Arc<dyn BusInformationRepository>) -> Self {
        Self { repository }
    }

    /// Executes the use case.
    pub async fn execute(&self) -> Result<()> {
        // This method would contain the logic for fetching fresh data
        // and saving it to the repository.
        // For now, it just calls a method on the repository.
        self.repository.refresh_all_data().await
    }
}
