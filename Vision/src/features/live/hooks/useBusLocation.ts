// src/features/live/hooks/useBusLocation.ts

import { useEffect, useState } from "react";

import { busPollingService } from "@live/services/BusPollingService";

import type { BusItem } from "@live/models/data";
import type { BusDataError } from "@live/models/error";

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

    // Subscribe to bus location updates
    const unsubscribe = busPollingService.subscribe(
      routeName,
      (data) => {
        setBusList(data);
        setError(null);
        // Only clear other caches after we have data for the new route
        busPollingService.clearOtherCaches(routeName);
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
