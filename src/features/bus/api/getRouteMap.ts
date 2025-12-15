// src/features/bus/api/getRouteMap.ts

import { CacheManager } from "@core/cache/CacheManager";
import type { RouteInfo } from "@bus/types/data";

const routeMapCache = new CacheManager<Record<string, string[]>>();

/**
 * Fetches and caches the routeMap.json data.
 * This function ensures only one fetch request is made even if called multiple times.
 * @returns A promise that resolves to a map of route names to vehicle IDs
 */
export async function getRouteMap(): Promise<Record<string, string[]>> {
  return routeMapCache.getOrFetch("routeMap", async () => {
    const res = await fetch("/data/routeMap.json");
    if (!res.ok) throw new Error("🚫 Failed to fetch routeMap.json");
    return res.json() as Promise<Record<string, string[]>>;
  });
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
      console.warn(`⚠️ routeName '${routeName}' not found in routeMap.json`);
      return null;
    }

    return {
      routeName,
      representativeRouteId: routeIds[0],
      vehicleRouteIds: routeIds,
    };
  } catch (err) {
    console.error("❌ getRouteInfo internal error:", err);
    return null;
  }
}
