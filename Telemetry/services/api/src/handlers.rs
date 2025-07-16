// service/api/src/handlers.rs

use actix_web::{HttpResponse, Responder, web};
use anyhow::Result;
use application::{
    GetArrivalByBusStop,
    // PostUpdateData,
    GetBusLocationByCity,
    GetBusLocationByRoute,
    GetBusStopLocationByCity,
    GetPolylineByRoute,
};
use domain::{BusStopId, CityId, RouteId}; // Import the type-safe IDs
use log::error;

/// Handles GET requests to /getBusStopLocation/{city}
pub async fn get_busstop_location_by_city(
    city_id: web::Path<u8>,
    use_case: web::Data<GetBusStopLocationByCity>,
) -> impl Responder {
    // Wrap the primitive u8 in the CityId type
    handle_result(use_case.execute(CityId(city_id.into_inner())).await).await
}

/// Handles GET requests to /getBusStopArrival/{city}/{busStopId}
pub async fn get_busstop_arrival_by_busstopid(
    path: web::Path<(u8, String)>,
    use_case: web::Data<GetArrivalByBusStop>,
) -> impl Responder {
    let (city_id, bus_stop_id) = path.into_inner();

    // Wrap the primitives in their respective domain types
    handle_result(
        use_case
            .execute(CityId(city_id), &BusStopId(bus_stop_id))
            .await,
    )
    .await
}

/// Handles GET requests to /getBusLocation/{city}
pub async fn get_bus_location_by_city(
    city_id: web::Path<u8>,
    use_case: web::Data<GetBusLocationByCity>,
) -> impl Responder {
    // Wrap the primitive u8 in the CityId type
    handle_result(use_case.execute(CityId(city_id.into_inner())).await).await
}

/// Handles GET requests to /getBusLocation/{city}/{routeId}
pub async fn get_bus_location_by_routeid(
    path: web::Path<(u8, String)>,
    use_case: web::Data<GetBusLocationByRoute>,
) -> impl Responder {
    let (city_id, route_id) = path.into_inner();

    // Wrap the primitives in their respective domain types
    handle_result(use_case.execute(CityId(city_id), &RouteId(route_id)).await).await
}

/// Handles GET requests to /getRoutePolyline/{city}/{routeId}
pub async fn get_route_polyline_by_routeid(
    path: web::Path<(u8, String)>,
    use_case: web::Data<GetPolylineByRoute>,
) -> impl Responder {
    // This use case only needs the route_id, not the city_id
    let (_city_id, route_id) = path.into_inner();

    // Wrap the String in the RouteId type
    handle_result(use_case.execute(&RouteId(route_id)).await).await
}

/*
/// Handles POST requests to /update to trigger a full data refresh
pub async fn post_update(
    // No JSON body is needed, this is just a trigger
    use_case: web::Data<PostUpdateData>,
) -> impl Responder {
    // The use case now handles the entire update logic internally
    handle_result_unit(use_case.execute().await, "Update process initiated.").await
}
*/

/// Common result handler for all API endpoints
async fn handle_result<T: serde::Serialize>(result: Result<T, anyhow::Error>) -> impl Responder {
    match result {
        Ok(data) => HttpResponse::Ok().json(data),
        Err(err) => {
            error!("Handler error: {:?}", err);
            HttpResponse::InternalServerError().finish()
        }
    }
}

/// Handles result for operations that return no data
async fn handle_result_unit(
    result: Result<(), anyhow::Error>,
    success_msg: &'static str,
) -> impl Responder {
    match result {
        Ok(_) => HttpResponse::Accepted().body(success_msg),
        Err(e) => {
            error!("Operation failed: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}
