// src/features/bus/hooks/useBusData.ts

import { useEffect, useMemo, useState } from "react";
import { getRouteInfo } from "@/features/bus/api/getRouteMap";
import { usePolyline } from "@bus/hooks/usePolyline";
import { useBusDirection } from "@bus/hooks/useBusDirection";
import { useBusLocationData } from "@bus/hooks/useBusLocation";
import { mergePolylines } from "@/features/bus/api/getPolyline";

import type { RouteInfo } from "@bus/types/data";
import type { BusItem } from "@bus/types/data";

export interface UseBusData {
  routeInfo: RouteInfo | null;
  busList: BusItem[];
  getDirection: ReturnType<typeof useBusDirection>;
  mergedUp: L.LatLngTuple[];
  mergedDown: L.LatLngTuple[];
}

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
