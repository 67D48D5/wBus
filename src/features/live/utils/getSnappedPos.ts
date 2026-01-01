// src/features/live/utils/getSnappedPos.ts

import { snapToPolyline } from "@live/api/getPolyline";

import type { BusItem } from "@live/models/data";
import type { LatLngTuple } from "leaflet";

/**
 * Snap the bus position to the nearest point on the polyline and determine the direction.
 *
 * @param bus - BusItem Object
 * @param getDirection - Given nodeid, nodeord to get direction (1: up, 0: down)
 * @param upPolyline - Up polyline lat/lng coordinate list
 * @param downPolyline - Down polyline lat/lng coordinate list
 * @returns Snapped position, angle, and direction
 */
export function getSnappedPosition(
  bus: BusItem,
  getDirection: (nodeid: string, nodeord: number) => number | null,
  upPolyline: LatLngTuple[],
  downPolyline: LatLngTuple[]
): {
  position: LatLngTuple;
  angle: number;
  direction: number;
} {
  const { gpslati, gpslong, nodeid } = bus;
  const nodeord = Number(bus.nodeord); // if nodeord is a string, convert to number

  const direction = getDirection(nodeid, nodeord) ?? 0;

  const polyline = (
    direction === 1 ? upPolyline : downPolyline
  ) as LatLngTuple[];

  // Try to snap the bus position to the nearest point on the polyline
  if (polyline.length >= 2) {
    const snapped = snapToPolyline(
      [gpslati, gpslong],
      polyline.map(([lat, lng]) => [lat, lng] as [number, number])
    );
    if (snapped && snapped.position && snapped.angle !== undefined) {
      return {
        position: snapped.position as LatLngTuple,
        angle: snapped.angle,
        direction,
      };
    }
  }

  // If snapping fails, return the original GPS position with angle 0
  return {
    position: [gpslati, gpslong],
    angle: 0,
    direction,
  };
}
