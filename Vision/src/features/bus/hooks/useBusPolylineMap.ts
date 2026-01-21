// src/features/bus/hooks/useBusPolylineMap.ts

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@core/config/env";

import { getPolyline, getRouteDetails, getStationMap } from "@bus/api/getStaticData";

import { mergePolylines, transformPolyline } from "@map/utils/polyUtils";

import { shouldSwapPolylines } from "@bus/utils/polylineDirection";

import type { LatLngTuple } from "leaflet";

export interface BusPolylineSet {
  upPolyline: LatLngTuple[];
  downPolyline: LatLngTuple[];
}

export function useBusPolylineMap(routeIds: string[]) {
  const [polylineMap, setPolylineMap] = useState<Map<string, BusPolylineSet>>(
    new Map()
  );
  const routeKey = useMemo(() => routeIds.slice().sort().join("|"), [routeIds]);

  useEffect(() => {
    if (routeIds.length === 0) {
      setPolylineMap(new Map());
      return;
    }

    let cancelled = false;

    const loadPolylines = async () => {
      let stationMap = null;

      try {
        stationMap = await getStationMap();
      } catch (error) {
        if (APP_CONFIG.IS_DEV) {
          console.error("[useBusPolylineMap] Error fetching station map", error);
        }
      }

      const results = await Promise.all(
        routeIds.map(async (routeId) => {
          try {
            const [data, routeDetail] = await Promise.all([
              getPolyline(routeId),
              getRouteDetails(routeId),
            ]);
            return { routeId, data, routeDetail };
          } catch (error) {
            if (APP_CONFIG.IS_DEV) {
              console.error(
                "[useBusPolylineMap] Error fetching polyline data for routeId: " +
                  routeId,
                error
              );
            }
            return { routeId, data: null, routeDetail: null };
          }
        })
      );

      if (cancelled) return;

      const nextMap = new Map<string, BusPolylineSet>();
      results.forEach(({ routeId, data, routeDetail }) => {
        if (!data) return;
        const { upPolyline, downPolyline } = transformPolyline(data);
        const mergedUp = mergePolylines(upPolyline);
        const mergedDown = mergePolylines(downPolyline);
        const isRoundTrip =
          data.features.length === 1 &&
          data.features[0]?.properties?.is_turning_point === true;

        const shouldSwap = isRoundTrip
          ? shouldSwapPolylines(routeDetail, stationMap, mergedUp, mergedDown)
          : false;

        nextMap.set(routeId, {
          upPolyline: shouldSwap ? mergedDown : mergedUp,
          downPolyline: shouldSwap ? mergedUp : mergedDown,
        });
      });

      setPolylineMap(nextMap);
    };

    void loadPolylines();

    return () => {
      cancelled = true;
    };
  }, [routeIds, routeKey]);

  return polylineMap;
}
