// crates/infrastructure/src/lib.rs

use anyhow::Result;
use async_trait::async_trait;
use domain::{Bus, BusArrival, BusRepository, BusRoute, BusStop, BusStopId, CityId, RouteId};
use moka::future::Cache;
use std::time::Duration;

/// An in-memory cache implementation of the BusRepository.
/// It uses separate caches for each domain model for clarity and performance.
pub struct InMemoryCache {
    // Caches for static data (routes, stops)
    routes: Cache<RouteId, BusRoute>,
    stops: Cache<BusStopId, BusStop>,

    // Caches for real-time data with a Time-to-Live (TTL)
    buses: Cache<String, Bus>, // Keyed by vehicle ID
    arrivals: Cache<(BusStopId, RouteId), BusArrival>, // Composite key
}

impl InMemoryCache {
    /// Creates a new, empty in-memory cache.
    pub fn new() -> Self {
        Self {
            // Static data can live for a long time.
            routes: Cache::builder().max_capacity(10_000).build(),
            stops: Cache::builder().max_capacity(50_000).build(),

            // Real-time data should expire to avoid showing stale information.
            // Let's set a 5-minute TTL.
            buses: Cache::builder()
                .max_capacity(50_000)
                .time_to_live(Duration::from_secs(5 * 60))
                .build(),
            arrivals: Cache::builder()
                .max_capacity(200_000)
                .time_to_live(Duration::from_secs(5 * 60))
                .build(),
        }
    }
}

#[async_trait]
impl BusRepository for InMemoryCache {
    // Methods for static data

    async fn find_route_by_bus(&self, route_id: &RouteId) -> Result<Option<BusRoute>> {
        Ok(self.routes.get(route_id).await)
    }

    async fn find_all_route_by_city(&self, city_id: CityId) -> Result<Vec<BusRoute>> {
        // NOTE: This is an O(n) scan, which is acceptable for in-memory caches
        // but would be inefficient for a large database without indexing.
        let filtered = self
            .routes
            .iter()
            .map(|(_, v)| v.clone())
            .filter(|r| r.city_id == city_id)
            .collect();
        Ok(filtered)
    }

    async fn find_all_bus_stop_by_city(&self, city_id: CityId) -> Result<Vec<BusStop>> {
        let filtered = self
            .stops
            .iter()
            .map(|(_, v)| v.clone())
            .filter(|s| s.city_id == city_id)
            .collect();
        Ok(filtered)
    }

    // Methods for real-time data

    async fn find_all_bus_by_city(&self, city_id: CityId) -> Result<Vec<Bus>> {
        let filtered = self
            .buses
            .iter()
            .map(|(_, v)| v.clone())
            .filter(|b| b.city_id == city_id)
            .collect();
        Ok(filtered)
    }

    async fn find_all_bus_by_route(&self, city_id: CityId, route_id: &RouteId) -> Result<Vec<Bus>> {
        let filtered = self
            .buses
            .iter()
            .map(|(_, v)| v.clone())
            .filter(|b| b.city_id == city_id && &b.route_id == route_id)
            .collect();
        Ok(filtered)
    }

    async fn find_arrival_by_bus_stop(
        &self,
        _city_id: CityId, // This parameter is unused in the current logic but kept for trait conformity.
        stop_id: &BusStopId,
    ) -> Result<Vec<BusArrival>> {
        // Since arrivals are not keyed by city, we must scan.
        let filtered = self
            .arrivals
            .iter()
            .map(|(_, v)| v.clone())
            .filter(|a| &a.stop_id == stop_id)
            .collect();
        Ok(filtered)
    }

    // Methods for saving/updating data

    async fn save_bus_route(&self, routes: Vec<BusRoute>) -> Result<()> {
        for route in routes {
            self.routes.insert(route.id.clone(), route).await;
        }
        Ok(())
    }

    async fn save_bus_stop(&self, stops: Vec<BusStop>) -> Result<()> {
        for stop in stops {
            self.stops.insert(stop.id.clone(), stop).await;
        }
        Ok(())
    }

    async fn save_realtime_bus(&self, buses: Vec<Bus>) -> Result<()> {
        for bus in buses {
            self.buses.insert(bus.id.clone(), bus).await;
        }
        Ok(())
    }

    async fn save_realtime_arrival(&self, arrivals: Vec<BusArrival>) -> Result<()> {
        for arrival in arrivals {
            let key = (arrival.stop_id.clone(), arrival.route_id.clone());
            self.arrivals.insert(key, arrival).await;
        }
        Ok(())
    }
}
