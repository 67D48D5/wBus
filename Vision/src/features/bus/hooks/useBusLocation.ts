// src/features/bus/hooks/useBusLocation.ts

import { useEffect, useState } from "react";

import { busPollingService } from "@bus/services/BusPollingService";

import type { BusItem } from "@core/domain/live";
import type { BusDataError } from "@core/domain/error";

/**
 * React hook to subscribe to bus location updates for a given route.
 * Automatically manages subscription lifecycle and cleanup.
 */
export function useBusLocationData(routeName: string): {
  data: BusItem[];
  error: BusDataError;
  hasFetched: boolean;
} {
  const [busList, setBusList] = useState<BusItem[]>([]);
  const [error, setError] = useState<BusDataError>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!routeName) return;

    setBusList([]);
    setError(null);
    setHasFetched(false);

    // Subscribe to bus location updates
    const unsubscribe = busPollingService.subscribe(
      routeName,
      (data) => {
        setBusList(data);
        setError(null);
        setHasFetched(true);
        // Only clear other caches after we have data for the new route
        busPollingService.clearOtherCaches(routeName);
      },
      (err) => {
        setError(err);
        setHasFetched(true);
        if (err !== null) {
          setBusList([]);
        }
      }
    );

    return unsubscribe;
  }, [routeName]);

  return { data: busList, error, hasFetched };
}
