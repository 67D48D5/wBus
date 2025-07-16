// service/api/src/handlers.rs

use application::{
    GetBusLocationByCity, GetBusLocationByRoute, GetBusStopArrivalByBusStop,
    GetBusStopLocationByCity, GetRoutePolylineByRoute, UpdateData,
};

use actix_web::{HttpResponse, Responder, web};

/// Handles GET requests to /busstop/{city}
pub async fn get_busstop_location_by_city(
    // Extracts the city ID from the URL path, u8 is used for city ID
    city_id: web::Path<u8>,
    // Extracts the shared application use case from web::Data
    use_case: web::Data<GetBusStopLocationByCity>,
) -> impl Responder {
    handle_result(use_case.execute(city_id.into_inner()).await).await
}

/// Handles GET requests to /busstop/{city}/{busStopId}
pub async fn get_busstop_arrival_by_busstopid(
    // Extract multiple params as a tuple
    path: web::Path<(u8, u16)>,
    // Extracts the shared application use case from web::Data
    use_case: web::Data<GetBusStopArrivalByBusStop>,
) -> impl Responder {
    // Destructure the path to get both values
    let (city_id, bus_stop_id) = path.into_inner();

    // Pass both to the execute method
    handle_result(use_case.execute(city_id, bus_stop_id).await).await
}

/// Handles GET requests to /bus/{city}
pub async fn get_buses_location_by_city(
    // Extracts the city ID from the URL path, u8 is used for city ID
    city_id: web::Path<u8>,
    // Extracts the shared application use case from web::Data
    use_case: web::Data<GetBusLocationByCity>,
) -> impl Responder {
    handle_result(use_case.execute(city_id.into_inner()).await).await
}

/// Handles GET requests to /bus/{city}/{routeId}
pub async fn get_bus_location_by_routeid(
    // Extract multiple params as a tuple
    path: web::Path<(u8, u16)>,
    use_case: web::Data<GetBusLocationByRoute>,
) -> impl Responder {
    // Destructure the tuple to get your values
    let (city_id, route_id) = path.into_inner();

    // Pass BOTH city_id and bus_id to the use case
    handle_result(use_case.execute(city_id, route_id).await).await
}

/// Handles GET requests to /polyline/{city}/{routeId}
pub async fn get_bus_polyline_by_routeid(
    // Extract both city and route IDs as a tuple
    path: web::Path<(u8, u16)>,
    // Extracts the shared application use case from web::Data
    use_case: web::Data<GetRoutePolylineByRoute>,
) -> impl Responder {
    // Destructure the path to get both values
    let (city_id, route_id) = path.into_inner();

    // Pass both to the execute method
    handle_result(use_case.execute(city_id, route_id).await).await
}

/// Handles POST requests to /update to trigger a full data refresh
pub async fn post_update(
    // No JSON body is needed, this is just a trigger
    use_case: web::Data<UpdateData>,
) -> impl Responder {
    // The use case now handles the entire update logic internally
    handle_result_unit(use_case.execute().await, "Update process initiated.").await
}

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
