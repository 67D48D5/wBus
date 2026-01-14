// src/features/live/hooks/useBusStop.ts

import { useEffect, useState } from "react";

import { APP_CONFIG } from "@core/config/env";
import { ERROR_MESSAGES } from "@core/config/locale";

import { CacheManager } from "@core/cache/CacheManager";

import { getRouteInfo } from "@live/api/getStaticData";
import { getBusStopLocationData } from "@live/api/getStaticData";

import { useBusContext } from "@live/context/MapContext";
import { getHaversineDistance } from "@live/utils/geoUtils";

import type { BusStop } from "@core/domain/live";

const stopCache = new CacheManager<BusStop[]>();
const routeStopsCache = new CacheManager<BusStop[]>();

const MIN_VALID_STOPS = 4;

export function useBusStop(routeName: string) {
  const [stops, setStops] = useState<BusStop[]>(() => {
    return routeStopsCache.get(routeName) ?? [];
  });

  useEffect(() => {
    let isMounted = true;
    if (!routeName) return;

    const load = async () => {
      try {
        const cachedStops = routeStopsCache.get(routeName);
        if (cachedStops) {
          if (isMounted) setStops(cachedStops);
        }

        const routeInfo = await getRouteInfo(routeName);
        if (!routeInfo) {
          if (APP_CONFIG.IS_DEV) {
            console.warn(ERROR_MESSAGES.NO_ROUTE_INFO_FOUND(routeName));
          }
          return;
        }

        const allStops = await stopCache.getOrFetch("Stations", async () => {
          const fetchedData = await getBusStopLocationData();
          return fetchedData.sort(
            (a: BusStop, b: BusStop) => a.nodeord - b.nodeord
          );
        });

        const routeVehicleIds = new Set(routeInfo.vehicleRouteIds);
        const filteredByRoute = allStops.filter(
          (stop) => stop.nodeid && routeVehicleIds.has(stop.nodeid)
        );

        // Matching Logic:
        // 1. If the number of matched stops is sufficient, use them.
        // 2. If the number of matched stops is too few (added logic: fix for route 90)
        // -> abandon filtering and use the entire stop dataset.
        const isValidRoute = filteredByRoute.length >= MIN_VALID_STOPS;

        const stopsToUse = isValidRoute ? filteredByRoute : allStops;

        // Cache the stops for this route
        routeStopsCache.set(routeName, stopsToUse);

        if (APP_CONFIG.IS_DEV) {
          console.debug(
            `[useBusStop] Route "${routeName}": rawIds=${routeInfo.vehicleRouteIds.length}, matched=${filteredByRoute.length}, threshold=${MIN_VALID_STOPS}, fallback=${!isValidRoute}`
          );
        }
        if (isMounted) setStops(stopsToUse);
      } catch (err) {
        if (APP_CONFIG.IS_DEV) {
          console.error(ERROR_MESSAGES.BUS_STOP_FETCH_ERROR, err);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [routeName]);

  return stops;
}

export function useClosestStopOrd(routeName: string): number | null {
  const { map } = useBusContext();
  const stops = useBusStop(routeName);
  const [closestOrd, setClosestOrd] = useState<number | null>(null);

  useEffect(() => {
    if (!map || stops.length === 0) return;

    let isUnmounted = false;

    const updateClosest = () => {
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
        if (APP_CONFIG.IS_DEV) {
          console.warn("[useClosestStopOrd] Unable to read map center yet", err);
        }
      }
    };

    const attachListeners = () => {
      updateClosest();
      map.on("moveend", updateClosest);
    };

    map.whenReady(attachListeners);

    return () => {
      isUnmounted = true;
      map.off("moveend", updateClosest);
    };
  }, [map, stops]);

  return closestOrd;
}
