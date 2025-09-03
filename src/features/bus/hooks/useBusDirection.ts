// src/features/bus/hooks/useBusDirection.ts

import { useMemo } from "react";
import { useBusStop } from "./useBusStop";

// @TODO: Move this to a config file or constants module
const ALWAYS_UPWARD_NODEIDS = new Set(["WJB251036041"]);

export function useBusDirection(routeName: string) {
  const stops = useBusStop(routeName);

  /**
   * Returns the up/down direction code for a bus stop based on its ID and order in the route.
   */
  const getDirection = useMemo(() => {
    return (nodeid: string | null | undefined, nodeord: number): number | null => {
      // Handle cases where nodeid is not a valid string.
      if (!nodeid) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[useBusDirection] Invalid nodeid received: ${nodeid}`);
        }
        return null;
      }

      // If the stop ID is in the list of always upward stops
      if (ALWAYS_UPWARD_NODEIDS.has(nodeid)) {
        return 1; // Upward
      }

      const matchingStops = stops.filter((stop) => stop.nodeid === nodeid);
      if (matchingStops.length === 0) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[useBusDirection] Failed to match stop for nodeid ${nodeid}`);
        }
        return null;
      }
      if (matchingStops.length === 1) {
        return matchingStops[0].updowncd;
      }

      // If there are multiple matches, select the stop with the closest order
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
