// src/features/bus/hooks/useBusPolylineMap.ts

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@core/config/env";

import { getPolyline, getRouteDetails, getStationMap } from "@bus/api/getStaticData";

import {
  hasExplicitPolylineDirections,
  mergePolylines,
  transformPolyline
} from "@/features/bus/utils/polyUtils";
import { shouldSwapPolylines } from "@bus/utils/polylineDirection";

import type { StationLocation } from "@core/domain/station";
import type { RouteDetail } from "@core/domain/route";
import type { GeoPolyline } from "@core/domain/polyline";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type Coordinate = [number, number];

export interface BusPolylineSet {
  upPolyline: Coordinate[];
  downPolyline: Coordinate[];
}

interface FetchedRouteData {
  routeId: string;
  data: GeoPolyline | null;
  routeDetail: RouteDetail | null;
}

// ----------------------------------------------------------------------
// Helper: Pure Processing Logic
// ----------------------------------------------------------------------

/**
 * Processes raw API data into render-ready polylines.
 * Handles splitting, merging, and direction correction (swapping).
 */
function processRouteData(
  routeId: string,
  data: GeoPolyline,
  routeDetail: RouteDetail | null,
  stationMap: Record<string, StationLocation> | null
): BusPolylineSet {
  // 1. Split raw data into Up/Down segments
  const { upPolyline, downPolyline } = transformPolyline(data);

  // 2. Merge segments into continuous lines
  const mergedUp = mergePolylines(upPolyline);
  const mergedDown = mergePolylines(downPolyline);

  return {
    upPolyline: mergedUp,
    downPolyline: mergedDown,
  };
}

// ----------------------------------------------------------------------
// Main Hook
// ----------------------------------------------------------------------

export function useBusPolylineMap(routeIds: string[]) {
  const [polylineMap, setPolylineMap] = useState<Map<string, BusPolylineSet>>(
    new Map()
  );

  // Create a stable key to prevent re-fetching when array reference changes but content is same
  const routeKey = useMemo(() => routeIds.slice().sort().join("|"), [routeIds]);

  useEffect(() => {
    if (!routeKey) {
      setPolylineMap(new Map());
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      // 1. Parallel Fetching: Station Map + All Route Data
      // We don't wait for stationMap to start fetching routes.
      const stationMapPromise = getStationMap().catch((err) => {
        if (APP_CONFIG.IS_DEV) console.error("[useBusPolylineMap] Station Map Error", err);
        return null;
      });

      const routesPromise = Promise.all(
        routeIds.map(async (routeId): Promise<FetchedRouteData> => {
          try {
            const [data, routeDetail] = await Promise.all([
              getPolyline(routeId),
              getRouteDetails(routeId),
            ]);
            return { routeId, data, routeDetail };
          } catch (error) {
            if (APP_CONFIG.IS_DEV) {
              console.error(`[useBusPolylineMap] Route Error (${routeId})`, error);
            }
            return { routeId, data: null, routeDetail: null };
          }
        })
      );

      const [stationMap, routesData] = await Promise.all([
        stationMapPromise,
        routesPromise
      ]);

      if (!isMounted) return;

      // 2. Process Data
      const nextMap = new Map<string, BusPolylineSet>();

      routesData.forEach(({ routeId, data, routeDetail }) => {
        if (!data) return;

        const processed = processRouteData(routeId, data, routeDetail, stationMap);
        nextMap.set(routeId, processed);
      });

      setPolylineMap(nextMap);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [routeKey]); // Depends only on the content-based key, not the routeIds array reference.

  return polylineMap;
}
