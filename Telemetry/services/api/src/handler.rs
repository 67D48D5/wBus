// service/api/src/handlers.rs

use crate::AppState;

use actix_web::{HttpResponse, Responder, web};
use anyhow::Result;
use domain::{BusStopId, CityId, RouteId};
use log::{error, info};

/// Handles GET requests to /getBusStopLocation/{city}
pub async fn get_all_bus_stop_location_by_city(
    city_id: web::Path<u8>,
    app_state: web::Data<AppState>, // Use the central AppState
) -> impl Responder {
    info!("HANDLER: Request for bus stops in city: {}", city_id);
    // Access the use case from AppState
    handle_result(
        app_state
            .get_all_bus_stop_location_by_city
            .execute(CityId(city_id.into_inner()))
            .await,
    )
    .await
}

/// Handles GET requests to /getBusStopArrival/{city}/{busStopId}
pub async fn get_arrival_by_bus_stop(
    path: web::Path<(u8, String)>,
    app_state: web::Data<AppState>, // Use the central AppState
) -> impl Responder {
    let (city_id, bus_stop_id) = path.into_inner();
    info!(
        "HANDLER: Request for arrivals at stop: {} in city: {}",
        bus_stop_id, city_id
    );
    // Access the use case from AppState
    handle_result(
        app_state
            .get_arrival_by_bus_stop
            .execute(CityId(city_id), &BusStopId(bus_stop_id))
            .await,
    )
    .await
}

/// Handles GET requests to /getBusLocation/{city}
pub async fn get_all_bus_location_by_city(
    city_id: web::Path<u8>,
    app_state: web::Data<AppState>, // Use the central AppState
) -> impl Responder {
    info!("HANDLER: Request for bus locations in city: {}", city_id);
    // Access the use case from AppState
    handle_result(
        app_state
            .get_all_bus_location_by_city
            .execute(CityId(city_id.into_inner()))
            .await,
    )
    .await
}

/// Handles GET requests to /getBusLocation/{city}/{routeId}
pub async fn get_all_bus_location_by_route(
    path: web::Path<(u8, String)>,
    app_state: web::Data<AppState>, // Use the central AppState
) -> impl Responder {
    let (city_id, route_id) = path.into_inner();
    info!(
        "HANDLER: Request for bus locations on route: {} in city: {}",
        route_id, city_id
    );
    // Access the use case from AppState
    handle_result(
        app_state
            .get_all_bus_location_by_route
            .execute(CityId(city_id), &RouteId(route_id))
            .await,
    )
    .await
}

/// Handles GET requests to /getRoutePolyline/{city}/{routeId}
pub async fn get_route_polyline_by_route(
    path: web::Path<(u8, String)>,
    app_state: web::Data<AppState>, // Use the central AppState
) -> impl Responder {
    let (_city_id, route_id) = path.into_inner();
    info!("HANDLER: Request for polyline for route: {}", route_id);
    // Access the use case from AppState
    handle_result(
        app_state
            .get_polyline_by_route
            .execute(&RouteId(route_id))
            .await,
    )
    .await
}

/// Common result handler for all API endpoints
async fn handle_result<T: serde::Serialize>(result: Result<T, anyhow::Error>) -> impl Responder {
    match result {
        Ok(data) => HttpResponse::Ok().json(data),
        Err(err) => {
            error!("HANDLER ERROR: {:?}", err);
            HttpResponse::InternalServerError().finish()
        }
    }
}
