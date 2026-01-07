// src/features/live/api/getRouteMap.ts

import { fetchAPI } from "@core/api/fetchAPI";
import { CacheManager } from "@core/cache/CacheManager";

import { DATA_SOURCE } from "@core/constants/env";
import { ERROR_MESSAGES } from "@core/constants/locale";

import type { BusStop, RouteInfo, RouteDetail } from "@live/models/data";

interface RouteMapData {
  lastUpdated: string;
  route_numbers: Record<string, string[]>;
  route_details: Record<string, RouteDetail>;
}

interface StationData {
  stations: Record<string, BusStop>;
}

const routeMapCache = new CacheManager<RouteMapData>();
const stationCache = new CacheManager<StationData>();

/**
 * Build URL for route map based on remote/local mode
 */
function getRouteMapUrl(): string {
  if (DATA_SOURCE.USE_REMOTE && DATA_SOURCE.BASE_URL) {
    return `${DATA_SOURCE.BASE_URL}/${DATA_SOURCE.PATHS.ROUTE_MAP}`;
  }
  return "/data/routeMap.json";
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
      console.warn(ERROR_MESSAGES.ROUTE_NOT_FOUND_IN_MAP(routeName));
      return null;
    }

    return {
      routeName,
      representativeRouteId: routeIds[0],
      vehicleRouteIds: routeIds,
    };
  } catch (err) {
    console.error(ERROR_MESSAGES.GET_ROUTE_INFO_ERROR, err);
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
