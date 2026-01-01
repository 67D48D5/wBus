// src/features/live/hooks/useBusDirection.ts

import { useMemo, useCallback } from "react";

import { useBusStop } from "./useBusStop";

import { ALWAYS_UPWARD_NODE_IDS } from "@core/constants/env";

import type { BusStop } from "@live/models/data";

/** Direction codes for bus routes */
export const Direction = {
  UP: 1,
  DOWN: 2,
} as const;

export type DirectionCode = (typeof Direction)[keyof typeof Direction] | null;

const ALWAYS_UPWARD_NODEIDS = new Set(ALWAYS_UPWARD_NODE_IDS);

/** Type for the direction lookup map: nodeid -> array of matching stops */
type StopLookupMap = Map<string, BusStop[]>;

/**
 * Custom hook that provides a function to determine the direction (up/down) of a bus
 * based on its current stop ID and order in the route.
 *
 * @param routeName - The name of the bus route (e.g., "30", "34")
 * @returns A memoized function that returns the direction code for a given stop
 *
 * @example
 * const getDirection = useBusDirection("30");
 * const direction = getDirection("WJB251000001", 5); // Returns 1 (up) or 2 (down)
 */
export function useBusDirection(routeName: string) {
  const stops = useBusStop(routeName);

  /**
   * Build a lookup map for O(1) access by nodeid.
   * Groups all stops by their nodeid for efficient matching.
   */
  const stopLookupMap = useMemo((): StopLookupMap => {
    const map = new Map<string, BusStop[]>();
    for (const stop of stops) {
      const existing = map.get(stop.nodeid);
      if (existing) {
        existing.push(stop);
      } else {
        map.set(stop.nodeid, [stop]);
      }
    }
    return map;
  }, [stops]);

  /**
   * Find the closest stop from a list of matching stops based on nodeord.
   * When distances are equal, prefers the stop that comes earlier in route order.
   */
  const findClosestStop = useCallback(
    (matchingStops: BusStop[], targetNodeord: number): BusStop => {
      return matchingStops.reduce((prev, curr) => {
        const prevDist = Math.abs(prev.nodeord - targetNodeord);
        const currDist = Math.abs(curr.nodeord - targetNodeord);

        if (currDist < prevDist) {
          return curr;
        }
        // Tie-breaker: prefer the stop with lower nodeord (earlier in route)
        if (currDist === prevDist && curr.nodeord < prev.nodeord) {
          return curr;
        }
        return prev;
      });
    },
    []
  );

  /**
   * Returns the up/down direction code for a bus stop based on its ID and order in the route.
   *
   * @param nodeid - The unique identifier of the bus stop
   * @param nodeord - The order/sequence number of the stop in the route
   * @returns Direction code (1 = up, 2 = down) or null if unable to determine
   */
  const getDirection = useCallback(
    (nodeid: string | null | undefined, nodeord: number): DirectionCode => {
      // Validate nodeid input
      if (!nodeid || typeof nodeid !== "string" || nodeid.trim() === "") {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[useBusDirection] Invalid nodeid received: ${JSON.stringify(nodeid)}`
          );
        }
        return null;
      }

      const normalizedNodeid = nodeid.trim();

      // Check override list first - always upward stops
      if (ALWAYS_UPWARD_NODEIDS.has(normalizedNodeid)) {
        return Direction.UP;
      }

      // Look up matching stops from the pre-built map
      const matchingStops = stopLookupMap.get(normalizedNodeid);

      // No matching stops found
      if (!matchingStops || matchingStops.length === 0) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[useBusDirection] No matching stop found for nodeid: ${normalizedNodeid}`
          );
        }
        return null;
      }

      // Single match - return directly
      if (matchingStops.length === 1) {
        return matchingStops[0].updowncd as DirectionCode;
      }

      // Multiple matches - find the closest one by nodeord
      const closestStop = findClosestStop(matchingStops, nodeord);
      return closestStop.updowncd as DirectionCode;
    },
    [stopLookupMap, findClosestStop]
  );

  return getDirection;
}
