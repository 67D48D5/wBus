// src/features/live/utils/getSnappedPos.ts

import { snapToPolyline } from "@live/api/getPolyline";

import type { BusItem } from "@live/models/data";
import type { LatLngTuple } from "leaflet";

/**
 * Calculate the distance between two lat/lng coordinates in meters (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
      // Check if the snapped position is too far from the original position (threshold: 200 meters)
      const distance = calculateDistance(
        gpslati,
        gpslong,
        snapped.position[0],
        snapped.position[1]
      );

      // If the distance is within threshold, use snapped position; otherwise, use original position
      if (distance <= 200) {
        return {
          position: snapped.position as LatLngTuple,
          angle: snapped.angle,
          direction,
        };
      }
    }
  }

  // If snapping fails or bus is too far, return the original GPS position with angle 0
  return {
    position: [gpslati, gpslong],
    angle: 0,
    direction,
  };
}
