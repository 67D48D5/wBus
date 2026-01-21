// src/features/bus/hooks/useBusPolyline.ts

import { useEffect, useState } from "react";

import { APP_CONFIG } from "@core/config/env";

import { getPolyline } from "@bus/api/getStaticData";

import { transformPolyline } from "@bus/utils/polyUtils";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type Coordinate = [number, number];

interface PolylineState {
  // Returns array of segments (Coordinate[][]) to support multi-colored segments if needed.
  // If you only need a single line, use mergePolylines utility in the consumer.
  upPolyline: Coordinate[][];
  downPolyline: Coordinate[][];
}

const INITIAL_STATE: PolylineState = {
  upPolyline: [],
  downPolyline: [],
};

// ----------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------

export function useBusPolyline(routeId?: string | null) {
  const [polylines, setPolylines] = useState<PolylineState>(INITIAL_STATE);

  useEffect(() => {
    // 1. Reset or Early Return
    if (!routeId) {
      setPolylines(INITIAL_STATE);
      return;
    }

    let isMounted = true;

    // Reset previous data immediately to prevent "ghosting" of the old route
    setPolylines(INITIAL_STATE);

    const fetchAndTransform = async () => {
      try {
        const rawData = await getPolyline(routeId);

        if (!isMounted) return;

        if (rawData) {
          // Optimization: Transform immediately, don't store raw GeoJSON in state
          const transformed = transformPolyline(rawData);
          setPolylines(transformed);
        } else {
          // Handle 404 or empty data
          setPolylines(INITIAL_STATE);
        }
      } catch (error) {
        if (APP_CONFIG.IS_DEV) {
          console.error(`[useBusPolyline] Failed to fetch route ${routeId}`, error);
        }
        if (isMounted) setPolylines(INITIAL_STATE);
      }
    };

    void fetchAndTransform();

    // 2. Cleanup to prevent race conditions
    return () => {
      isMounted = false;
    };
  }, [routeId]);

  return polylines;
}
