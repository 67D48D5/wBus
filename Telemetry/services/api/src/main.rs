// service/api/src/main.rs

pub mod handler;
pub mod poller;

use application::{
    GetArrivalByBusStop,
    GetBusLocationByCity,
    GetBusLocationByRoute,
    GetBusStopLocationByCity,
    GetPolylineByRoute,
    // PostUpdateData,
};
use domain::BusRepository;
use infrastructure::InMemoryCache;

use actix_web::{App, HttpServer, web};
use log::{info, warn};
use serde::Deserialize;
use std::sync::Arc;

/// Defines the application's configuration structure.
#[derive(Deserialize, Clone)]
struct Config {
    server_addr: String,
    server_port: u16,
}

/// A struct to hold all shared application state, including use cases.
/// This makes dependency injection much cleaner.
pub struct AppState {
    get_all_bus_stop_location_by_city: GetBusStopLocationByCity,
    get_arrival_by_bus_stop: GetArrivalByBusStop,
    get_all_bus_location_by_city: GetBusLocationByCity,
    get_all_bus_location_by_route: GetBusLocationByRoute,
    get_polyline_by_route: GetPolylineByRoute,
    // post_update_data: PostUpdateData,
}

impl AppState {
    /// Creates a new instance of the application state.
    fn new(repo: Arc<dyn BusRepository>) -> Self {
        Self {
            get_all_bus_stop_location_by_city: GetBusStopLocationByCity::new(repo.clone()),
            get_arrival_by_bus_stop: GetArrivalByBusStop::new(repo.clone()),
            get_all_bus_location_by_city: GetBusLocationByCity::new(repo.clone()),
            get_all_bus_location_by_route: GetBusLocationByRoute::new(repo.clone()),
            get_polyline_by_route: GetPolylineByRoute::new(repo.clone()),
            // post_update_data: PostUpdateData::new(repo),
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Environment and Logging Setup
    dotenv::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // Simplified Configuration Loading
    let config = config::Config::builder()
        .add_source(config::Environment::default().separator("__"))
        .build()
        .and_then(|builder| builder.try_deserialize::<Config>())
        .unwrap_or_else(|e| {
            warn!(
                "Failed to load config from environment: {}. Using defaults.",
                e
            );
            Config {
                server_addr: "127.0.0.1".to_string(),
                server_port: 8080,
            }
        });

    let server_address = format!("{}:{}", config.server_addr, config.server_port);
    info!("Starting API at http://{}", server_address);

    // State Initialization
    let repository: Arc<dyn BusRepository> = Arc::new(InMemoryCache::new());

    // Start the poller in a separate thread
    poller::spawn_poller(repository.clone());

    let app_state = web::Data::new(AppState::new(repository));

    // Server Startup
    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone()) // Register the entire AppState
            .configure(configure_routes)
    })
    .bind(&server_address)?
    .run()
    .await
}

/// Configures the application's routes.
fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/getBusLocation/{city}",
        web::get().to(handler::get_all_bus_location_by_city),
    )
    .route(
        "/getBusLocation/{city}/{routeId}",
        web::get().to(handler::get_all_bus_location_by_route),
    )
    .route(
        "/getBusStopLocation/{city}",
        web::get().to(handler::get_all_bus_stop_location_by_city),
    )
    .route(
        "/getBusStopArrival/{city}/{busStopId}",
        web::get().to(handler::get_arrival_by_bus_stop),
    )
    .route(
        "/getRoutePolyline/{city}/{routeId}",
        web::get().to(handler::get_route_polyline_by_route),
    );
}
