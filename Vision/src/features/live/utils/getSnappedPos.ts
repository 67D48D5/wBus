// src/features/live/utils/getSnappedPos.ts

import { snapToPolyline } from "@live/utils/polyUtils";

import type { LatLngTuple } from "leaflet";

import type { BusItem } from "@core/domain/live";

// Snap max distance in meters
const MAX_SNAP_DISTANCE = 50;

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
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
 * Snap bus location to the nearest route line.
 * If direction information is missing or incorrect, automatically select the closer line.
 */
export function getSnappedPosition(
  bus: BusItem,
  getDirection: (nodeid: string, nodeord: number, routeid?: string | null) => number | null,
  upPolyline: LatLngTuple[],
  downPolyline: LatLngTuple[]
): {
  position: LatLngTuple;
  angle: number;
  direction: number;
} {
  const { gpslati, gpslong, nodeid } = bus;
  const nodeord = Number(bus.nodeord);

  // 1. Direction information provided by the API (null if absent)
  const apiDirection = getDirection(nodeid, nodeord, bus.routeid);

  // Default coordinates (used if snapping fails)
  const rawPosition: LatLngTuple = [gpslati, gpslong];
  const defaultResult = { position: rawPosition, angle: 0, direction: apiDirection ?? 0 };

  // Helper function: Attempt to snap to a specific polyline
  const trySnap = (targetPolyline: LatLngTuple[], dir: number) => {
    if (!targetPolyline || targetPolyline.length < 2) return null;

    const snapped = snapToPolyline(rawPosition as [number, number], targetPolyline as [number, number][]);
    if (!snapped || !snapped.position) return null;

    const dist = calculateDistance(gpslati, gpslong, snapped.position[0], snapped.position[1]);
    return { ...snapped, distance: dist, direction: dir };
  };

  // 2. Attempt to snap to both up (1) and down (0) directions and calculate distances
  const snapUp = trySnap(upPolyline, 1);
  const snapDown = trySnap(downPolyline, 0);

  // 3. Logic to determine the best snap position
  let bestSnap = null;

  // 3-1. If API direction information is clear and the snap distance for that direction is within the allowed range, prioritize it
  if (apiDirection === 1 && snapUp && snapUp.distance <= MAX_SNAP_DISTANCE) {
    bestSnap = snapUp;
  } else if (apiDirection === 0 && snapDown && snapDown.distance <= MAX_SNAP_DISTANCE) {
    bestSnap = snapDown;
  }
  // 3-2. If API direction information is missing (null) or the snap distance for the API direction is too far (possible data error), choose the closer one
  else {
    const validUp = snapUp && snapUp.distance <= MAX_SNAP_DISTANCE;
    const validDown = snapDown && snapDown.distance <= MAX_SNAP_DISTANCE;

    if (validUp && validDown) {
      // If both are valid, choose the closer one
      bestSnap = snapUp!.distance < snapDown!.distance ? snapUp : snapDown;
    } else if (validUp) {
      bestSnap = snapUp;
    } else if (validDown) {
      bestSnap = snapDown;
    }
  }

  // 4. Return the result
  if (bestSnap) {
    return {
      position: bestSnap.position as LatLngTuple,
      angle: bestSnap.angle ?? 0,
      direction: bestSnap.direction, // Return corrected direction
    };
  }

  // If snapping fails, return the original coordinates (but try to follow the API direction as much as possible)
  return defaultResult;
}
