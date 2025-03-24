// src/utils/getArrival.ts

import type { ArrivalInfo } from "@/types/data";

export function getNextBusArrivalInfo(routeName: string, data: ArrivalInfo[]) {
  const target = data.find(
    (bus) => bus.routeno.replace("-", "") === routeName.replace("-", "")
  );
  if (!target) return null;

  return {
    minutes: Math.ceil(target.arrtime / 60),
    stopsAway: target.arrprevstationcnt,
  };
}

export function formatArrivalMessage(
  routeName: string,
  minutes: number,
  stops: number
): string {
  return `${routeName}번 버스는 약 ${minutes}분 후 (${stops} 정류장 전) 도착합니다.`;
}
