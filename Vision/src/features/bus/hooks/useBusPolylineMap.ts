// src/features/bus/hooks/useBusPolylineMap.ts

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@core/config/env";

import { getPolyline } from "@bus/api/getStaticData";

import { mergePolylines, transformPolyline } from "@map/utils/polyUtils";

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
      const results = await Promise.all(
        routeIds.map(async (routeId) => {
          try {
            const data = await getPolyline(routeId);
            return { routeId, data };
          } catch (error) {
            if (APP_CONFIG.IS_DEV) {
              console.error(
                "[useBusPolylineMap] Error fetching polyline data for routeId: " +
                  routeId,
                error
              );
            }
            return { routeId, data: null };
          }
        })
      );

      if (cancelled) return;

      const nextMap = new Map<string, BusPolylineSet>();
      results.forEach(({ routeId, data }) => {
        if (!data) return;
        const { upPolyline, downPolyline } = transformPolyline(data);
        nextMap.set(routeId, {
          upPolyline: mergePolylines(upPolyline),
          downPolyline: mergePolylines(downPolyline),
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
