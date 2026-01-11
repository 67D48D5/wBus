// src/features/live/hooks/useBusStop.ts

import { useEffect, useState } from "react";

import { CacheManager } from "@core/cache/CacheManager";
import { ERROR_MESSAGES } from "@core/config/locale";

import { getRouteInfo } from "@live/api/getStaticData";
import { getBusStopLocationData } from "@live/api/getStaticData";

import { useBusContext } from "@live/context/MapContext";
import { getHaversineDistance } from "@live/utils/geoUtils";

import type { BusStop } from "@core/domain/live";

const stopCache = new CacheManager<BusStop[]>();
const routeStopsCache = new CacheManager<BusStop[]>();

export function useBusStop(routeName: string) {
  const [stops, setStops] = useState<BusStop[]>(() => {
    // Initialize with cached data if available to prevent flash of empty state
    return routeStopsCache.get(routeName) ?? [];
  });

  useEffect(() => {
    let isMounted = true;
    if (!routeName) return;

    const load = async () => {
      try {
        // Check cache first and use it immediately
        const cachedStops = routeStopsCache.get(routeName);
        if (cachedStops) {
          if (isMounted) setStops(cachedStops);
        }

        const routeInfo = await getRouteInfo(routeName);
        if (!routeInfo) {
          console.warn(ERROR_MESSAGES.NO_ROUTE_INFO_FOUND(routeName));
          return;
        }

        // Get all stops once (global cache key)
        const allStops = await stopCache.getOrFetch("Stations", async () => {
          const fetchedData = await getBusStopLocationData();
          return fetchedData.sort(
            (a: BusStop, b: BusStop) => a.nodeord - b.nodeord
          );
        });

        // Try to filter by vehicleRouteIds if they match any stops
        const routeVehicleIds = new Set(routeInfo.vehicleRouteIds);
        const filteredByRoute = allStops.filter(
          (stop) => stop.nodeid && routeVehicleIds.has(stop.nodeid)
        );

        // If we got stops matching the route IDs, use them; otherwise use all stops
        // This handles the case where vehicleRouteIds are actual station IDs for some routes
        // but not for others
        const stopsToUse = filteredByRoute.length > 0 ? filteredByRoute : allStops;

        // Cache the stops for this route
        routeStopsCache.set(routeName, stopsToUse);

        console.log(`[useBusStop] Route "${routeName}": vehicleIds=${routeInfo.vehicleRouteIds.length}, matched=${filteredByRoute.length}, using=${stopsToUse.length} stops`);
        if (isMounted) setStops(stopsToUse);
      } catch (err) {
        console.error(ERROR_MESSAGES.BUS_STOP_FETCH_ERROR, err);
      }
    };

    load();

    // Cleanup function to avoid setting state on unmounted component
    return () => {
      isMounted = false;
    };
  }, [routeName]);

  return stops;
}

/**
 * Get the closest bus stop's nodeord based on the current map center.
 *
 * @param routeName routeName
 * @returns Closest stop's nodeord or null if no stops are available
 */
export function useClosestStopOrd(routeName: string): number | null {
  const { map } = useBusContext();
  const stops = useBusStop(routeName);
  const [closestOrd, setClosestOrd] = useState<number | null>(null);

  useEffect(() => {
    if (!map || stops.length === 0) return;

    let isUnmounted = false;

    const updateClosest = () => {
      // Leaflet throws if getCenter runs before the map is fully ready; guard with a try/catch
      try {
        const { lat, lng } = map.getCenter();
        const closestStop = stops.reduce((prev, curr) => {
          const prevDistance = getHaversineDistance(lat, lng, prev.gpslati, prev.gpslong);
          const currDistance = getHaversineDistance(lat, lng, curr.gpslati, curr.gpslong);
          return currDistance < prevDistance ? curr : prev;
        }, stops[0]);

        if (!isUnmounted) {
          setClosestOrd(closestStop.nodeord);
        }
      } catch (err) {
        console.warn("[useClosestStopOrd] Unable to read map center yet", err);
      }
    };

    const attachListeners = () => {
      // First update when the hook is called
      updateClosest();

      // Update closest stop when the map is moved
      map.on("moveend", updateClosest);
    };

    // Ensure the map is fully initialized before calling getCenter to avoid _leaflet_pos errors
    map.whenReady(attachListeners);

    return () => {
      isUnmounted = true;
      map.off("moveend", updateClosest);
    };
  }, [map, stops]);

  return closestOrd;
}
