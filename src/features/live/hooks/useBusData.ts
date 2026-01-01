// src/features/live/hooks/useBusData.ts

import { useEffect, useMemo, useState } from "react";
import { getRouteInfo } from "@live/api/getRouteMap";
import { usePolyline } from "@live/hooks/usePolyline";
import { useBusDirection } from "@live/hooks/useBusDirection";
import { useBusLocationData } from "@live/hooks/useBusLocation";
import { mergePolylines } from "@live/api/getPolyline";

import type { RouteInfo } from "@live/models/data";
import type { BusItem } from "@live/models/data";

export interface UseBusData {
  routeInfo: RouteInfo | null;
  busList: BusItem[];
  getDirection: ReturnType<typeof useBusDirection>;
  mergedUp: L.LatLngTuple[];
  mergedDown: L.LatLngTuple[];
}

/**
 * Custom hook that aggregates all bus-related data for a given route.
 * Combines route information, bus locations, polylines, and direction data.
 * @param routeName - The name of the route (e.g., "30", "34")
 * @returns An object containing all bus data for the route
 */
export function useBusData(routeName: string): UseBusData {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const { data: busList } = useBusLocationData(routeName);
  const { upPolyline, downPolyline } = usePolyline(routeName);
  const directionFn = useBusDirection(routeName);

  useEffect(() => {
    getRouteInfo(routeName).then(setRouteInfo);
  }, [routeName]);

  const mergedUp = useMemo(() => mergePolylines(upPolyline), [upPolyline]);
  const mergedDown = useMemo(
    () => mergePolylines(downPolyline),
    [downPolyline]
  );

  return {
    routeInfo,
    busList,
    getDirection: directionFn,
    mergedUp,
    mergedDown,
  };
}
