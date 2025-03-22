// src/hooks/useBusStops.ts

import { useEffect, useState } from "react";
import { fetchBusStopLocationData } from "@/utils/fetchData";
import { getRouteInfo } from "@/utils/getRouteInfo";
import type { BusStop } from "@/types/route";

const stopCache: Record<string, BusStop[]> = {};
const stopPromises: Record<string, Promise<BusStop[]>> = {};

export function useBusStops(routeName: string) {
  const [stops, setStops] = useState<BusStop[]>([]);

  useEffect(() => {
    if (!routeName) return;

    const load = async () => {
      try {
        const routeInfo = await getRouteInfo(routeName);
        if (!routeInfo) {
          console.warn(`❌ No routeInfo found for ${routeName}`);
          return;
        }

        const repRouteId = routeInfo.representativeRouteId;

        if (stopCache[repRouteId]) {
          setStops(stopCache[repRouteId]);
          return;
        }

        if (!stopPromises[repRouteId]) {
          stopPromises[repRouteId] = fetchBusStopLocationData(repRouteId)
            .then((data) => {
              const sorted = data.sort(
                (a: BusStop, b: BusStop) => a.nodeord - b.nodeord
              );
              stopCache[repRouteId] = sorted;
              return sorted;
            })
            .finally(() => {
              delete stopPromises[repRouteId];
            });
        }

        const fetched = await stopPromises[repRouteId];
        setStops(fetched);
      } catch (err) {
        console.error("❌ useBusStops fetch error:", err);
      }
    };

    load();
  }, [routeName]);

  return stops;
}
