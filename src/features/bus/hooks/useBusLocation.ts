// src/features/bus/hooks/useBusLocation.ts

import { useEffect, useState } from "react";

import { API_REFRESH_INTERVAL } from "@core/constants/env";

import { getBusLocationData } from "@bus/api/getRealtimeData";
import { getRouteMap } from "@bus/api/getRouteMap";

import type { BusItem } from "@bus/types/data";
import type { BusDataError } from "@bus/types/error";

const cache: Record<string, BusItem[]> = {};
const dataListeners: Record<string, Set<(data: BusItem[]) => void>> = {};
const errorListeners: Record<string, Set<(errMsg: BusDataError) => void>> = {};

/**
 * Clears all cached data and listeners except for the given route.
 */
function clearOtherCaches(current: string) {
  Object.keys(cache).forEach((key) => {
    if (key !== current) {
      delete cache[key];
      delete dataListeners[key];
      delete errorListeners[key];
    }
  });
}

/**
 * React hook to subscribe to bus location updates for a given route.
 */
export function useBusLocationData(routeName: string): {
  data: BusItem[];
  error: BusDataError;
} {
  const [busList, setBusList] = useState<BusItem[]>([]);
  const [error, setError] = useState<BusDataError>(null);

  useEffect(() => {
    if (!routeName) return;

    // Remove all cached data for other routes
    clearOtherCaches(routeName);

    // Data update callback
    const updateData = (data: BusItem[]) => {
      setBusList(data);
      setError(null);
    };

    // Error handling callback
    const updateError = (msg: BusDataError) => {
      setError(msg);
      if (msg !== null) {
        setBusList([]);
      }
    };

    // Initialize listener sets if they don't exist
    if (!dataListeners[routeName]) {
      dataListeners[routeName] = new Set();
    }
    if (!errorListeners[routeName]) {
      errorListeners[routeName] = new Set();
    }

    dataListeners[routeName].add(updateData);
    errorListeners[routeName].add(updateError);

    // If data is already cached, notify immediately
    if (cache[routeName]) {
      setBusList(cache[routeName]);
      setTimeout(() => {
        dataListeners[routeName]?.forEach((cb) => cb(cache[routeName]!));
      }, 0);
    }

    // Cleanup function to remove callbacks and prevent memory leaks
    return () => {
      dataListeners[routeName]?.delete(updateData);
      errorListeners[routeName]?.delete(updateError);
      
      // Clean up empty listener sets
      if (dataListeners[routeName]?.size === 0) {
        delete dataListeners[routeName];
      }
      if (errorListeners[routeName]?.size === 0) {
        delete errorListeners[routeName];
      }
    };
  }, [routeName]);

  return { data: busList, error };
}

const VALID_ERROR_CODES: Set<Exclude<BusDataError, null>> = new Set([
  "ERR:NONE_RUNNING",
  "ERR:NETWORK",
  "ERR:INVALID_ROUTE",
]);

/**
 * Starts polling bus location data for the specified routes.
 * Returns a cleanup function to stop polling and remove listeners.
 */
export function startBusPolling(routeNames: string[]) {
  const intervals: NodeJS.Timeout[] = [];
  const cleanupCallbacks: (() => void)[] = [];

  for (const routeName of routeNames) {
    const fetchAndUpdate = async () => {
      try {
        const routeMap = await getRouteMap();
        const vehicleIds = routeMap[routeName];

        if (!vehicleIds || vehicleIds.length === 0) {
          throw new Error("ERR:INVALID_ROUTE");
        }

        const results = await Promise.allSettled(
          vehicleIds.map((id) => getBusLocationData(id))
        );

        const fulfilled = results.filter(
          (r): r is PromiseFulfilledResult<BusItem[]> =>
            r.status === "fulfilled"
        );

        if (fulfilled.length === 0) {
          throw new Error("ERR:NETWORK");
        }

        const buses = fulfilled.flatMap((r) => r.value);

        cache[routeName] = buses;
        dataListeners[routeName]?.forEach((cb) => cb(buses));

        if (buses.length === 0) {
          errorListeners[routeName]?.forEach((cb) => cb("ERR:NONE_RUNNING"));
        } else {
          errorListeners[routeName]?.forEach((cb) => cb(null));
        }
      } catch (err) {
        console.error("❌ Bus polling error:", err);
        cache[routeName] = [];
        dataListeners[routeName]?.forEach((cb) => cb([]));

        let errorCode: BusDataError = "ERR:NETWORK";
        if (
          err instanceof Error &&
          VALID_ERROR_CODES.has(err.message as Exclude<BusDataError, null>)
        ) {
          errorCode = err.message as BusDataError;
        }

        errorListeners[routeName]?.forEach((cb) => cb(errorCode));
      }
    };

    // Immediate fetch
    fetchAndUpdate();

    // Set up polling interval
    const interval = setInterval(fetchAndUpdate, API_REFRESH_INTERVAL);
    intervals.push(interval);

    // Visibility listener - refresh data when page becomes visible
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchAndUpdate();
    };
    
    // Page show listener - refresh data when page is restored from cache
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetchAndUpdate();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    // Cleanup function for this route
    cleanupCallbacks.push(() => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    });
  }

  // Returns cleanup function that removes all intervals and listeners for all routes
  return () => {
    cleanupCallbacks.forEach((fn) => fn());
  };
}
