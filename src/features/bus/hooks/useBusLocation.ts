// src/features/bus/hooks/useBusLocation.ts

import { useEffect, useState } from "react";
import { busPollingService } from "@bus/services/BusPollingService";

import type { BusItem } from "@bus/types/data";
import type { BusDataError } from "@bus/types/error";

/**
 * React hook to subscribe to bus location updates for a given route.
 * Automatically manages subscription lifecycle and cleanup.
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
    busPollingService.clearOtherCaches(routeName);

    // Subscribe to bus location updates
    const unsubscribe = busPollingService.subscribe(
      routeName,
      (data) => {
        setBusList(data);
        setError(null);
      },
      (err) => {
        setError(err);
        if (err !== null) {
          setBusList([]);
        }
      }
    );

    return unsubscribe;
  }, [routeName]);

  return { data: busList, error };
}

/**
 * Starts polling bus location data for the specified routes.
 * Returns a cleanup function to stop polling.
 * 
 * @deprecated Since v2.0, will be removed in v3.0. 
 * Use the busPollingService.startPolling() method directly or useBusLocationData hook instead.
 * Migration: Replace `startBusPolling(routes)` with `routes.map(r => busPollingService.startPolling(r))`.
 */
export function startBusPolling(routeNames: string[]): () => void {
  const cleanupFunctions = routeNames.map((routeName) =>
    busPollingService.startPolling(routeName)
  );

  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
}
