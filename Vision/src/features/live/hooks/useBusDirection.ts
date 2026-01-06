// src/features/live/hooks/useBusDirection.ts

import { useMemo, useCallback } from "react";

import { useBusStop } from "./useBusStop";

import { ERROR_MESSAGES } from "@core/constants/locale";
import { ALWAYS_UPWARD_NODE_IDS } from "@core/constants/env";

import { getRouteDetails } from "@live/api/getRouteMap";

import type { BusStop } from "@live/models/data";

/** Direction codes for bus routes */
// Normalize to 1 (up) and 0 (down) to match icon expectations
export const Direction = {
  UP: 1,
  DOWN: 0,
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
   * @returns Direction code (1 = up, 0 = down) or null if unable to determine
   */
  const getDirection = useCallback(
    (nodeid: string | null | undefined, nodeord: number): DirectionCode => {
      // Validate nodeid input
      if (!nodeid || typeof nodeid !== "string" || nodeid.trim() === "") {
        return null;
      }

      const normalizedNodeid = nodeid.trim();

      // Check override list first - always upward stops
      if (ALWAYS_UPWARD_NODEIDS.has(normalizedNodeid)) {
        return Direction.UP;
      }

      // Look up matching stops from the pre-built map
      const matchingStops = stopLookupMap.get(normalizedNodeid);

      // No matching stops found - silently return null for buses on stops not in our data
      if (!matchingStops || matchingStops.length === 0) {
        return null;
      }

      const normalize = (updowncd: number): DirectionCode =>
        updowncd === 0 ? Direction.DOWN : Direction.UP;

      // Single match - return directly
      if (matchingStops.length === 1) {
        return normalize(matchingStops[0].updowncd);
      }

      // Multiple matches - find the closest one by nodeord
      const closestStop = findClosestStop(matchingStops, nodeord);
      return normalize(closestStop.updowncd);
    },
    [stopLookupMap, findClosestStop]
  );

  return getDirection;
}

/**
 * Check if a stop exists in the current route's stop data
 * Useful for filtering out buses at stops that aren't in our database
 * @param routeName - The name of the bus route
 * @returns A function that checks if a nodeid exists
 */
export function useStopExists(routeName: string) {
  const stops = useBusStop(routeName);

  const stopSet = useMemo(() => {
    return new Set(stops.map((stop) => stop.nodeid));
  }, [stops]);

  return useCallback((nodeid: string | null | undefined): boolean => {
    if (!nodeid || typeof nodeid !== "string") return false;
    return stopSet.has(nodeid.trim());
  }, [stopSet]);
}

/**
 * Helper function to get direction from route_details using routeid and nodeord.
 * This is a standalone async function that uses the new routeMap schema.
 * 
 * @param routeid - The route ID from realtime bus data (e.g., "WJB251000068")
 * @param nodeord - The current node order from realtime bus data
 * @returns Direction code (1 = up, 0 = down) or null if unable to determine
 * 
 * @example
 * const direction = await getDirectionFromRouteDetails(bus.routeid, bus.nodeord);
 */
export async function getDirectionFromRouteDetails(
  routeid: string,
  nodeord: number
): Promise<DirectionCode> {
  try {
    const routeDetail = await getRouteDetails(routeid);

    if (!routeDetail || !routeDetail.sequence) {
      return null;
    }

    // Find the stop in the sequence with matching nodeord
    const stopInfo = routeDetail.sequence.find(s => s.nodeord === nodeord);

    if (stopInfo) {
      // updowncd: 0 = down/하행, 1 = up/상행
      return stopInfo.updowncd === 0 ? Direction.DOWN : Direction.UP;
    }

    return null;
  } catch (err) {
    console.error(ERROR_MESSAGES.GET_ROUTE_INFO_ERROR(routeid), err);
    return null;
  }
}
