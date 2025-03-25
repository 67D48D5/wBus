// src/hooks/useBusDirection.ts

import { useMemo } from "react";
import { useBusStops } from "@/hooks/useBusStops";

export function useBusDirection(routeName: string) {
  const stops = useBusStops(routeName);

  return useMemo(() => {
    /**
     * @param nodeid   현재 정류장 ID
     * @param nodeord  해당 정류장의 순번(노선에서의 위치)
     * @returns updowncd(1 또는 2) | null
     */
    return function getDirection(
      nodeid: string,
      nodeord: number
    ): number | null {
      const matches = stops.filter((s) => s.nodeid === nodeid);
      if (matches.length === 0) return null;

      if (matches.length === 1) {
        return matches[0].updowncd;
      }

      // 만약 동일 nodeid가 상하행 2개 이상 있을 때 → nodeord가 가장 가까운 것 선택
      const closest = matches.reduce((prev, curr) => {
        return Math.abs(curr.nodeord - nodeord) <
          Math.abs(prev.nodeord - nodeord)
          ? curr
          : prev;
      });

      return closest.updowncd;
    };
  }, [stops]);
}
