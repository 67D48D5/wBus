// service/api/src/main.rs

pub mod handlers;

use application::{
    GetArrivalByBusStop,
    GetBusLocationByCity,
    GetBusLocationByRoute,
    GetBusStopLocationByCity,
    GetPolylineByRoute,
    // PostUpdateData,
};
use infrastructure::InMemoryCache;

use actix_web::{App, HttpServer, web};
use serde::Deserialize;
use std::sync::Arc;

/// Defines the application's configuration structure, mapping to .env variables.
#[derive(Deserialize)]
struct Config {
    // source_url: String,
    server_addr: String,
    server_port: u16,
}

/// Define fallback constants for the server address and port
const DEFAULT_ADDR: &str = "127.0.0.1";
const DEFAULT_PORT: u16 = 8080;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables from the .env file in the workspace root.
    // Fails silently if .env is not found, allowing for production env vars.
    if let Err(err) = dotenv::dotenv() {
        eprintln!(
            "⚠️ Failed to load .env file: {}. Using system environment variables.",
            err
        );
    }

    // Initialize configuration from environment variables.
    let config = match config::Config::builder()
        .add_source(config::Environment::default().separator("__"))
        .build()
    {
        Ok(builder) => match builder.try_deserialize::<Config>() {
            Ok(cfg) => cfg,
            Err(e) => {
                eprintln!("Failed to deserialize config: {}", e);
                // Provide default values on failure
                Config {
                    server_addr: DEFAULT_ADDR.to_string(),
                    server_port: DEFAULT_PORT,
                }
            }
        },
        Err(e) => {
            eprintln!("Failed to build config: {}", e);
            Config {
                server_addr: DEFAULT_ADDR.to_string(),
                server_port: DEFAULT_PORT,
            }
        }
    };

    let server_address = format!("{}:{}", config.server_addr, config.server_port);
    println!("🚀 Starting API server at http://{}", server_address);

    // Initialize the concrete repository implementation.
    let repository = Arc::new(InMemoryCache::new());

    // Create and wrap all application use cases for Actix.
    let get_bus_stop_location_use_case =
        web::Data::new(GetBusStopLocationByCity::new(repository.clone()));
    let get_bus_stop_arrival_use_case =
        web::Data::new(GetArrivalByBusStop::new(repository.clone()));
    let get_bus_location_by_city_use_case =
        web::Data::new(GetBusLocationByCity::new(repository.clone()));
    let get_bus_location_by_route_use_case =
        web::Data::new(GetBusLocationByRoute::new(repository.clone()));
    let get_route_polyline_by_route_use_case =
        web::Data::new(GetPolylineByRoute::new(repository.clone()));
    // let update_data_use_case = web::Data::new(PostUpdateData::new(repository.clone()));

    // Configure and start the HTTP server.
    HttpServer::new(move || {
        App::new()
            .app_data(get_bus_stop_location_use_case.clone())
            .app_data(get_bus_stop_arrival_use_case.clone())
            .app_data(get_bus_location_by_city_use_case.clone())
            .app_data(get_bus_location_by_route_use_case.clone())
            .app_data(get_route_polyline_by_route_use_case.clone())
            // .app_data(update_data_use_case.clone())
            .configure(configure_routes)
    })
    .bind(&server_address)?
    .run()
    .await
}

/// Configures the application's routes.
fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/")
            .route(
                "/getBusStop/{city}",
                web::get().to(handlers::get_busstop_location_by_city),
            )
            .route(
                "/getBusStopArrival/{city}/{busStopId}",
                web::get().to(handlers::get_busstop_arrival_by_busstopid),
            )
            .route(
                "/getBusLocation/{city}",
                web::get().to(handlers::get_bus_location_by_city),
            )
            .route(
                "/getBusLocation/{city}/{routeId}",
                web::get().to(handlers::get_bus_location_by_routeid),
            )
            .route(
                "/getRoutePolyline/{city}/{routeId}",
                web::get().to(handlers::get_route_polyline_by_routeid),
            ), // .route("/update", web::post().to(handlers::post_update)),
    );
}
