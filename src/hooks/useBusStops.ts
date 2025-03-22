// src/hooks/useBusStops.ts

import { useEffect, useState } from "react";
import { fetchBusStopLocationData } from "@/utils/fetchData";
import { getRepresentativeRouteId } from "@/utils/getRepresentativeRouteId";
import { getRouteNameFromId } from "@/utils/getRouteNameFromId";

type BusStop = {
  gpslati: number;
  gpslong: number;
  nodeid: string;
  nodenm: string;
  nodeord: number;
  updowncd: number;
};

const stopCache: Record<string, BusStop[]> = {};
const stopPromises: Record<string, Promise<BusStop[]>> = {};

export function useBusStops(routeId: string) {
  const [stops, setStops] = useState<BusStop[]>([]);

  useEffect(() => {
    if (!routeId) return;

    const load = async () => {
      try {
        const routeName = getRouteNameFromId(routeId) ?? routeId;
        const repRouteId = getRepresentativeRouteId(routeName);

        if (!repRouteId) {
          console.warn(`❌ No representative routeId found for ${routeName}`);
          return;
        }

        if (stopCache[repRouteId]) {
          setStops(stopCache[repRouteId]);
          return;
        }

        if (!stopPromises[repRouteId]) {
          stopPromises[repRouteId] = fetchBusStopLocationData(repRouteId)
            .then((data) => {
              stopCache[repRouteId] = data;
              return data;
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
  }, [routeId]);

  return stops;
}