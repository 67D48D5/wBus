// src/hooks/useBusStops.ts

import { useEffect, useState } from "react";
import { getBusStopLocationData } from "@/utils/getRealtimeData";
import { getRouteInfo } from "@/utils/getRouteMap";

import type { BusStop } from "@/types/data";

const stopCache: Record<string, BusStop[]> = {};
const stopPromises: Record<string, Promise<BusStop[]>> = {};

export function useBusStops(routeName: string) {
  const [stops, setStops] = useState<BusStop[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!routeName) return;

    const load = async () => {
      try {
        const routeInfo = await getRouteInfo(routeName);
        if (!routeInfo) {
          console.warn(`❌ No routeInfo found for ${routeName}`);
          return;
        }

        const repRouteId = routeInfo.representativeRouteId;

        // 이미 캐시된 데이터가 있다면 즉시 사용
        if (stopCache[repRouteId]) {
          if (isMounted) setStops(stopCache[repRouteId]);
          return;
        }

        // 진행 중인 요청이 없다면 새로운 요청 생성
        if (!stopPromises[repRouteId]) {
          stopPromises[repRouteId] = (async () => {
            const data = await getBusStopLocationData(repRouteId);
            const sorted = data.sort(
              (a: BusStop, b: BusStop) => a.nodeord - b.nodeord
            );
            stopCache[repRouteId] = sorted;
            return sorted;
          })();
          stopPromises[repRouteId].finally(() => {
            delete stopPromises[repRouteId];
          });
        }

        const fetched = await stopPromises[repRouteId];
        if (isMounted) setStops(fetched);
      } catch (err) {
        console.error("❌ useBusStops fetch error:", err);
      }
    };

    load();

    // 컴포넌트 언마운트 시 setStops 호출 방지를 위한 플래그 설정
    return () => {
      isMounted = false;
    };
  }, [routeName]);

  return stops;
}
