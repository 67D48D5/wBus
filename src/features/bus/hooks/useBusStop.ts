// src/features/bus/hooks/useBusStop.ts

import { useEffect, useState } from "react";

import { useMapContext } from "@map/context/MapContext";
import { CacheManager } from "@core/cache/CacheManager";
import { getHaversineDistance } from "@shared/utils/geoUtils";

import { getBusStopLocationData } from "@bus/api/getRealtimeData";
import { getRouteInfo } from "@bus/api/getRouteMap";

import type { BusStop } from "@bus/types/data";

const stopCache = new CacheManager<BusStop[]>();

export function useBusStop(routeName: string) {
  const [stops, setStops] = useState<BusStop[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!routeName) return;

    const load = async () => {
      try {
        const routeInfo = await getRouteInfo(routeName);
        if (!routeInfo) {
          console.warn(`❌ No routeInfo found for ${routeName}`);
          return;
        }

        const repRouteId = routeInfo.representativeRouteId;

        const data = await stopCache.getOrFetch(repRouteId, async () => {
          const fetchedData = await getBusStopLocationData(repRouteId);
          return fetchedData.sort(
            (a: BusStop, b: BusStop) => a.nodeord - b.nodeord
          );
        });

        if (isMounted) setStops(data);
      } catch (err) {
        console.error("❌ useBusStop fetch error:", err);
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
  const { map } = useMapContext();
  const stops = useBusStop(routeName);
  const [closestOrd, setClosestOrd] = useState<number | null>(null);

  useEffect(() => {
    if (!map || stops.length === 0) return;

    const updateClosest = () => {
      const { lat, lng } = map.getCenter();
      const closestStop = stops.reduce((prev, curr) => {
        const prevDistance = getHaversineDistance(lat, lng, prev.gpslati, prev.gpslong);
        const currDistance = getHaversineDistance(lat, lng, curr.gpslati, curr.gpslong);
        return currDistance < prevDistance ? curr : prev;
      }, stops[0]);

      setClosestOrd(closestStop.nodeord);
    };

    // First update when the hook is called
    updateClosest();

    // Update closest stop when the map is moved
    map.on("moveend", updateClosest);

    return () => {
      map.off("moveend", updateClosest);
    };
  }, [map, stops]);

  return closestOrd;
}
