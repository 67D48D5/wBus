// src/features/live/api/getStaticData.ts

import { fetchAPI, HttpError } from "@core/network/fetchAPI";
import { CacheManager } from "@core/cache/CacheManager";

import { API_CONFIG, APP_CONFIG } from "@core/config/env";
import { ERROR_MESSAGES } from "@core/config/locale";

import { GeoPolylineData } from "@core/domain/live";

import type { BusStop, RouteInfo, RouteDetail } from "@core/domain/live";

/**
 * Models for cached data
 */
interface RouteMapData {
  lastUpdated: string;
  route_numbers: Record<string, string[]>;
  route_details: Record<string, RouteDetail>;
}

interface StationData {
  stations: Record<string, BusStop>;
}

/**
 * Cache Managers
 */
const routeMapCache = new CacheManager<RouteMapData>();
const stationCache = new CacheManager<StationData>();
const polylineCache = new CacheManager<GeoPolylineData | null>();

/**
 * Build URL for polyline data based on remote/local mode
 */
function getPolylineUrl(routeKey: string): string {
  if (API_CONFIG.STATIC.USE_REMOTE && API_CONFIG.STATIC.BASE_URL) {
    return `${API_CONFIG.STATIC.BASE_URL}/${API_CONFIG.STATIC.PATHS.POLYLINES}/${routeKey}.geojson`;
  }
  return `/data/polylines/${routeKey}.geojson`;
}

/**
 * Build URL for route map based on remote/local mode
 */
function getRouteMapUrl(): string {
  if (API_CONFIG.STATIC.USE_REMOTE && API_CONFIG.STATIC.BASE_URL) {
    return `${API_CONFIG.STATIC.BASE_URL}/${API_CONFIG.STATIC.PATHS.ROUTE_MAP}`;
  }
  return "/data/routeMap.json";
}

/**
 * Build URL for map style data based on remote/local mode
 * Priority: 1. NEXT_PUBLIC_MAP_URL, 2. Remote Static Data, 3. Local Data 4. Default Fallback
 * @return {string} - The full URL to fetch the map style JSON
 */
export function getMapStyleUrl(): string {
  const { STATIC } = API_CONFIG;

  // [Highest Priority] If an explicit map style URL is set (for custom styles)
  // Example: NEXT_PUBLIC_MAP_URL="/map/style.json" or an external URL
  if (process.env.NEXT_PUBLIC_MAP_URL) {
    return process.env.NEXT_PUBLIC_MAP_URL;
  }

  // If the file path is not set, fall back to default
  const stylePath = STATIC.PATHS.MAP_STYLE || "mapStyle.json";

  // Remote mode (USE_REMOTE=true)
  if (STATIC.USE_REMOTE) {
    if (!STATIC.BASE_URL || STATIC.BASE_URL === "NOT_SET") {
      if (APP_CONFIG.IS_DEV) {
        console.warn("[getMapStyleUrl] 'STATIC_API_URL' is not set while USE_REMOTE is true. Falling back to default.");
      }
      return API_CONFIG.MAP_STYLE_FALLBACK_API_URL;
    }
    // Use joinUrl utility to prevent duplicate slashes (defined in fetchAPI.ts)
    return joinUrl(STATIC.BASE_URL, stylePath);
  }

  // [Default] Local mode
  // If STATIC.BASE_URL is set to "/data", "/data/mapStyle.json" will be returned
  return joinUrl(STATIC.BASE_URL || "/data", stylePath);
}

/**
 * Fetches and caches the routeMap.json data.
 * This function ensures only one fetch request is made even if called multiple times.
 * @returns A promise that resolves to a map of route names to vehicle IDs (excludes empty routes)
 */
export async function getRouteMap(): Promise<Record<string, string[]>> {
  const data = await routeMapCache.getOrFetch("routeMap", async () => {
    return fetchAPI<RouteMapData>(getRouteMapUrl(), { baseUrl: "" });
  });
  // Filter out routes with empty vehicle IDs (e.g., "Shuttle": [])
  return Object.fromEntries(
    Object.entries(data.route_numbers).filter(([, ids]) => ids.length > 0)
  );
}

/**
 * Fetch the polyline geojson file for the provided key and cache the result.
 * The key should follow the naming scheme `${routeId}` to target
 * a specific route variant (falls back to `${routeName}` if no ID is provided).
 *
 * @param routeKey - filename-friendly key (ex: "30_WJB251000068")
 * @returns {Promise<GeoPolylineData | null>} - GeoJSON Data or null if not found
 */
export async function getPolyline(routeKey: string): Promise<GeoPolylineData | null> {
  return polylineCache.getOrFetch(routeKey, async () => {
    try {
      return await fetchAPI<GeoPolylineData>(getPolylineUrl(routeKey), { baseUrl: "" });
    } catch (error) {
      // Gracefully handle missing polyline files (404 errors)
      if (error instanceof HttpError && error.status === 404) {
        if (APP_CONFIG.IS_DEV) {
          console.warn(`[getPolyline] Polyline file not found: ${routeKey}`);
        }
        return null;
      }
      throw error;
    }
  });
}

/**
 * Fetches the custom map style JSON and applies localization logic.
 * This function caches the result to avoid redundant fetches.
 * @returns A promise that resolves to the modified map style JSON
 */
export async function getMapStyle(): Promise<any> {
  return await routeMapCache.getOrFetch("mapStyle", async () => {
    // Fetch the style JSON (baseUrl is used as defined in MAP_SETTINGS)
    const style = await fetchAPI<any>(getMapStyleUrl(), { baseUrl: "" });

    return style;
  });
}

/**
 * Fetches bus stop location data for a city bus route from `routeMap.json`.
 * This data is cached to minimize redundant fetch requests.
 * Maps the station key (nodeid) from the object key to the nodeid property.
 * @returns A promise that resolves to an array of bus stop items
 */
export async function getBusStopLocationData(): Promise<BusStop[]> {
  const data = await stationCache.getOrFetch("Stations", async () => {
    return fetchAPI<StationData>(getRouteMapUrl(), { baseUrl: "" });
  });
  // Map the station key (nodeid) from object keys to the nodeid property
  return Object.entries(data.stations).map(([nodeid, station]) => ({
    ...station,
    nodeid,
  }));
}

/**
 * Returns a list of available route names (only routes with vehicle IDs).
 */
export async function getAvailableRoutes(): Promise<string[]> {
  const routes = await getRouteMap();
  return Object.keys(routes);
}

/**
 * Returns a RouteInfo object for the given route name.
 * @param routeName - The name of the route (e.g., "30", "34")
 * @returns A promise that resolves to RouteInfo or null if not found
 */
export async function getRouteInfo(
  routeName: string
): Promise<RouteInfo | null> {
  try {
    const map = await getRouteMap();
    const routeIds = map[routeName];

    if (!routeIds?.length) {
      if (APP_CONFIG.IS_DEV) {
        console.warn(ERROR_MESSAGES.ROUTE_NOT_FOUND_IN_MAP(routeName));
      }
      return null;
    }

    return {
      routeName,
      representativeRouteId: routeIds[0],
      vehicleRouteIds: routeIds,
    };
  } catch (err) {
    if (APP_CONFIG.IS_DEV) {
      console.error(ERROR_MESSAGES.GET_ROUTE_INFO_ERROR, err);
    }
    return null;
  }
}

/**
 * Fetches route detail information including sequence data.
 * @param routeId - The ID of the route (e.g., "WJB251000068")
 * @returns A promise that resolves to RouteDetail or null if not found
 */
export async function getRouteDetails(
  routeId: string
): Promise<RouteDetail | null> {
  const data = await routeMapCache.getOrFetch("routeMap", async () => {
    return fetchAPI<RouteMapData>(getRouteMapUrl(), { baseUrl: "" });
  });
  return data.route_details[routeId] || null;
}

/**
 * URL assembly utility (removes duplicate slashes)
 */
function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}