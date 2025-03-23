// src/hooks/useBusDirection.ts

import { useMemo } from "react";
import { useBusStops } from "@/hooks/useBusStops";

export function useBusDirection(routeName: string) {
  const stops = useBusStops(routeName);

  return useMemo(() => {
    return function getDirection(
      nodeid: string,
      nodeord: number
    ): number | null {
      const matches = stops.filter((s) => s.nodeid === nodeid);
      if (matches.length === 0) return null;

      if (matches.length === 1) return matches[0].updowncd;

      // 다수 존재 → nodeord가 가장 가까운 걸 기준으로 선택
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
