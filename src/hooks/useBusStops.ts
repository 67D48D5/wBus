// src/hooks/useBusStops.ts

import { useEffect, useState, useRef } from "react";
import { fetchBusStopLocationData } from "@/utils/fetchData";
import { getRepresentativeRouteId } from "@/utils/getRepresentativeRouteId";

type BusStop = {
  gpslati: number;
  gpslong: number;
  nodeid: string;
  nodenm: string;
  nodeord: number;
  updowncd: number;
};

const busStopCache: Record<string, BusStop[]> = {};

export function useBusStops(routeName: string) {
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!routeName) return;
    
    isMounted.current = true;

    const loadBusStops = async () => {
      const repRouteId = getRepresentativeRouteId(routeName);
      if (!repRouteId) {
        console.warn(`❌ No representative routeId found for ${routeName}`);
        return;
      }

      if (busStopCache[repRouteId]) {
        setBusStops(busStopCache[repRouteId]);
        return;
      }

      const stops = await fetchBusStopLocationData(repRouteId);
      if (isMounted.current) {
        setBusStops(stops);
        busStopCache[repRouteId] = stops;
      }
    };

    loadBusStops();

    return () => {
      isMounted.current = false;
    };
  }, [routeName]);

  return busStops;
}
