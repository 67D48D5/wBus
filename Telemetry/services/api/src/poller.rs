// services/api/src/poller.rs

use domain::{Bus, BusRepository, CityId, Coordinates, RouteId};

use log::{error, info};
use std::{sync::Arc, time::Duration};
use tokio::time;

/// Spawns a background ƒtask to poll for data updates.
pub fn spawn_poller(repository: Arc<dyn BusRepository>) {
    tokio::spawn(async move {
        info!("Mock poller background task starting...");
        let mut interval = time::interval(Duration::from_secs(5));
        let mut bus_latitude = 35.1796; // Starting latitude for our mock bus (near Busan City Hall)

        loop {
            interval.tick().await;

            // Simulate fetching new data by creating a mock bus
            bus_latitude += 0.0005; // Move the bus north a little bit

            let mock_bus = Bus {
                id: "Busan-77-1234".to_string(), // A unique vehicle ID
                route_id: RouteId("724".to_string()),
                city_id: CityId(1), // Let's say 1 is Busan
                coordinates: Coordinates {
                    latitude: bus_latitude,
                    longitude: 129.0756,
                },
            };

            info!(
                "POLLER: Saving bus {} for city {} on route {} at lat: {}",
                mock_bus.id, mock_bus.city_id.0, mock_bus.route_id.0, mock_bus.coordinates.latitude
            );

            // Save the "new" data to the repository.
            if let Err(e) = repository.save_realtime_bus(vec![mock_bus]).await {
                error!("POLLER ERROR: Failed to save bus data: {}", e);
            }
        }
    });
}
