// src/features/bus/api/getRouteMap.ts

import type { RouteInfo } from "@bus/types/data";

let cache: Record<string, string[]> | null = null;
let pending: Promise<Record<string, string[]>> | null = null;

/**
 * Fetches and caches the routeMap.json data.
 */
export async function getRouteMap(): Promise<Record<string, string[]>> {
  if (cache) return cache;
  if (pending) return pending;

  pending = fetch("/data/routeMap.json")
    .then(async (res) => {
      if (!res.ok) throw new Error("🚫 Failed to fetch routeMap.json");
      const json = (await res.json()) as Record<string, string[]>;
      cache = json;
      return json;
    })
    .catch((err) => {
      console.error("❌ routeMap.json fetch error:", err);
      throw err;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

/**
 * Returns a RouteInfo object for the given route name.
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
