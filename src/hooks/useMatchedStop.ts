// src/hooks/useMatchedStop.ts

import type { BusStop } from "@/types/route";

export function getMatchedStop(
  nodeid: string,
  stops: BusStop[]
): BusStop | undefined {
  return stops.find((stop) => stop.nodeid === nodeid);
}

export function getUpDownCd(
  nodeid: string,
  stops: BusStop[],
  defaultValue = 0
): number {
  return getMatchedStop(nodeid, stops)?.updowncd ?? defaultValue;
}
