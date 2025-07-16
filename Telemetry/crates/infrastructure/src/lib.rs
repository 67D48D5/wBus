// crates/infrastructure/src/lib.rs

use domain::{BusInformation, BusInformationRepository};
use moka::future::Cache;
use std::time::Duration;

// This struct holds our in-memory cache.
pub struct InMemoryCache {
    cache: Cache<String, BusInformation>,
}

impl InMemoryCache {
    pub fn new() -> Self {
        // Create a new cache.
        // We'll make entries expire 5 minutes after they are inserted.
        // This is perfect for live data!
        let cache = Cache::builder()
            .time_to_live(Duration::from_secs(5 * 60))
            .build();

        Self { cache }
    }
}

// Implement the repository trait for our in-memory cache.
#[async_trait::async_trait]
impl BusInformationRepository for InMemoryCache {
    async fn find_by_id(&self, id: &str) -> Result<Option<BusInformation>, anyhow::Error> {
        // The .get() method is non-blocking and returns a copy.
        Ok(self.cache.get(id).await)
    }

    async fn save(&self, bus_info: &BusInformation) -> Result<(), anyhow::Error> {
        // The .insert() method is also non-blocking.
        // Moka requires the key and value to be owned.
        self.cache
            .insert(bus_info.id.clone(), bus_info.clone())
            .await;
        Ok(())
    }
}
