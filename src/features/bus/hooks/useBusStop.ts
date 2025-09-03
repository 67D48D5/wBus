// src/features/bus/hooks/useBusStop.ts

import { useEffect, useState } from "react";

import { useMapContext } from "@map/context/MapContext";

import { getBusStopLocationData } from "@bus/api/getRealtimeData";
import { getRouteInfo } from "@bus/api/getRouteMap";

import type { BusStop } from "@bus/types/data";

const stopCache: Record<string, BusStop[]> = {};
const stopPromises: Record<string, Promise<BusStop[]>> = {};

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

        // Use cached stops if available
        if (stopCache[repRouteId]) {
          if (isMounted) setStops(stopCache[repRouteId]);
          return;
        }

        // If not cached, fetch stops and cache the promise
        if (!stopPromises[repRouteId]) {
          stopPromises[repRouteId] = (async () => {
            const data = await getBusStopLocationData(repRouteId);
            const sorted = data.sort(
              (a: BusStop, b: BusStop) => a.nodeord - b.nodeord
            );
            stopCache[repRouteId] = sorted;
            return sorted;
          })();
          stopPromises[repRouteId].finally(() => {
            delete stopPromises[repRouteId];
          });
        }

        const fetched = await stopPromises[repRouteId];
        if (isMounted) setStops(fetched);
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
 * Get Haversine distance between two geographical points.
 *
 * @param lat1 First point's latitude
 * @param lon1 First point's longitude
 * @param lat2 Second point's latitude
 * @param lon2 Second point's longitude
 * @returns Distance in kilometers
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
        const prevDistance = getDistance(lat, lng, prev.gpslati, prev.gpslong);
        const currDistance = getDistance(lat, lng, curr.gpslati, curr.gpslong);
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
