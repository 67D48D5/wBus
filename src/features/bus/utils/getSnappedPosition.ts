// src/features/bus/utils/getSnappedPosition.ts

import { snapToPolyline } from "./getPolyline";
import type { BusItem } from "@bus/types/data";

export function getSnappedPosition(
  bus: BusItem,
  getDirection: (nodeid: string, nodeord: number) => number | null, // nodeord를 number로 받음
  upPolyline: L.LatLngTuple[],
  downPolyline: L.LatLngTuple[]
): {
  position: L.LatLngTuple;
  angle: number;
  direction: number;
} {
  // bus.nodeord가 number임을 가정 (또는 타입 변환이 필요하다면 여기서 변환)
  const direction = getDirection(bus.nodeid, bus.nodeord) ?? 0;
  const polyline = (direction === 1 ? upPolyline : downPolyline).map(
    ([lat, lng]) => [lat, lng] as [number, number]
  );

  if (polyline.length > 1) {
    const snapped = snapToPolyline([bus.gpslati, bus.gpslong], polyline);
    if (snapped) {
      return {
        position: snapped.position as L.LatLngTuple,
        angle: snapped.angle,
        direction,
      };
    }
  }

  return {
    position: [bus.gpslati, bus.gpslong],
    angle: 0,
    direction,
  };
}
