// src/hooks/useBusDirection.ts

import { useMemo } from "react";
import { useBusStops } from "@/hooks/useBusStops";

export function useBusDirection(routeName: string) {
  const stops = useBusStops(routeName);

  const getDirection = useMemo(() => {
    /**
     * 주어진 정류장 ID와 노선상의 위치(nodeord)를 기준으로
     * 상행/하행 코드를 반환합니다.
     *
     * @param nodeid   현재 정류장 ID
     * @param nodeord  정류장의 노선상 순서
     * @returns 상행/하행 코드(예: 1 또는 2) 또는 해당 정류장이 없으면 null
     */
    return (nodeid: string, nodeord: number): number | null => {
      const matchingStops = stops.filter((stop) => stop.nodeid === nodeid);
      if (matchingStops.length === 0) return null;
      if (matchingStops.length === 1) return matchingStops[0].updowncd;

      // 동일한 nodeid가 여러 개일 경우, nodeord와의 차이가 가장 적은 정류장을 선택
      const closestStop = matchingStops.reduce((prev, curr) =>
        Math.abs(curr.nodeord - nodeord) < Math.abs(prev.nodeord - nodeord)
          ? curr
          : prev
      );
      return closestStop.updowncd;
    };
  }, [stops]);

  return getDirection;
}
