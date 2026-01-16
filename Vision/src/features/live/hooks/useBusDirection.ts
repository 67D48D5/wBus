// src/features/live/hooks/useBusDirection.ts

import { useMemo, useCallback, useEffect, useState } from "react";

import { useBusStop } from "./useBusStop";

import { LOG_MESSAGES } from "@core/config/locale";
import { APP_CONFIG, MAP_SETTINGS } from "@core/config/env";

import { getRouteDetails, getRouteInfo } from "@live/api/getStaticData";

/** Direction codes for bus routes */
// Normalize to 1 (up) and 0 (down) to match icon expectations
export const Direction = {
  UP: 1,
  DOWN: 0,
} as const;

export type DirectionCode = (typeof Direction)[keyof typeof Direction] | null;

const ALWAYS_UPWARD_NODEIDS = new Set(MAP_SETTINGS.ALWAYS_UPWARD_NODE_IDS);

type SequenceLookupMap = Map<
  string,
  Array<{ routeid: string; nodeord: number; updowncd: number }>
>;

/**
 * Custom hook that provides a function to determine the direction (up/down) of a bus
 * based on its current stop ID and order in the route.
 *
 * @param routeName - The name of the bus route (e.g., "30", "34")
 * @returns A memoized function that returns the direction code for a given stop
 *
 * @example
 * const getDirection = useBusDirection("30");
 * const direction = getDirection("WJB251000001", 5); // Returns 1 (up) or 0 (down)
 */
export function useBusDirection(routeName: string) {
  const [routeSequences, setRouteSequences] = useState<
    Array<{ routeid: string; sequence: { nodeid: string; nodeord: number; updowncd: number }[] }>
  >([]);

  // Preload route details for the selected route (uses routeMap.json)
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const routeInfo = await getRouteInfo(routeName);
        if (!routeInfo) {
          if (isMounted) setRouteSequences([]);
          return;
        }

        const details = await Promise.all(
          routeInfo.vehicleRouteIds.map(async (routeid) => {
            const detail = await getRouteDetails(routeid);
            return detail ? { routeid, sequence: detail.sequence } : null;
          })
        );

        if (isMounted) {
          setRouteSequences(details.filter(Boolean) as Array<{ routeid: string; sequence: { nodeid: string; nodeord: number; updowncd: number }[] }>);
        }
      } catch (err) {
        if (APP_CONFIG.IS_DEV) {
          console.error(LOG_MESSAGES.ROUTE_MISSING(routeName), err);
        }
        if (isMounted) setRouteSequences([]);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [routeName]);

  // Build lookup: nodeid -> possible sequences (scoped to this route's IDs)
  const sequenceLookupMap = useMemo<SequenceLookupMap>(() => {
    const map: SequenceLookupMap = new Map();

    for (const { routeid, sequence } of routeSequences) {
      for (const { nodeid, nodeord, updowncd } of sequence) {
        const existing = map.get(nodeid) ?? [];
        existing.push({ routeid, nodeord, updowncd });
        map.set(nodeid, existing);
      }
    }

    return map;
  }, [routeSequences]);

  const activeRouteIds = useMemo(() => new Set(routeSequences.map(({ routeid }) => routeid)), [routeSequences]);

  /**
   * Returns the up/down direction code for a bus stop based on its ID and order in the route.
   *
   * @param nodeid - The unique identifier of the bus stop
   * @param nodeord - The order/sequence number of the stop in the route
   * @param routeid - Optional route ID from realtime data (helps disambiguate shared stops)
   * @returns Direction code (1 = up, 0 = down) or null if unable to determine
   */
  const getDirection = useCallback(
    (
      nodeid: string | null | undefined,
      nodeord: number,
      routeid?: string | null
    ): DirectionCode => {
      // Validate nodeid input
      if (!nodeid || typeof nodeid !== "string" || nodeid.trim() === "") {
        return null;
      }

      const normalizedNodeord = Number(nodeord);
      if (!Number.isFinite(normalizedNodeord)) {
        return null;
      }

      const normalizedNodeid = nodeid.trim();

      // Check override list first - always upward stops
      if (ALWAYS_UPWARD_NODEIDS.has(normalizedNodeid)) {
        return Direction.UP;
      }

      const normalize = (updowncd: number): DirectionCode =>
        updowncd === 0 ? Direction.DOWN : Direction.UP;

      const candidates = sequenceLookupMap.get(normalizedNodeid);

      if (!candidates || candidates.length === 0) {
        return null;
      }

      // Prefer candidates that match the routeid we received from realtime data
      const scopedCandidates = routeid
        ? candidates.filter((c) => c.routeid === routeid)
        : candidates.filter((c) => activeRouteIds.has(c.routeid));

      const pool = scopedCandidates.length > 0 ? scopedCandidates : candidates;

      // First try exact nodeord match, otherwise choose the closest by distance (tie -> lower nodeord)
      const exact = pool.find((c) => c.nodeord === normalizedNodeord);
      const chosen =
        exact ||
        pool.reduce((best, curr) => {
          const bestDist = Math.abs(best.nodeord - normalizedNodeord);
          const currDist = Math.abs(curr.nodeord - normalizedNodeord);

          if (currDist < bestDist) return curr;
          if (currDist === bestDist && curr.nodeord < best.nodeord) return curr;
          return best;
        }, pool[0]);

      return chosen ? normalize(chosen.updowncd) : null;
    },
    [activeRouteIds, sequenceLookupMap]
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
      // updowncd: 0 = down, 1 = up, 2 = cycle (treat cycle as up for our purposes)
      return stopInfo.updowncd === 0 ? Direction.DOWN : Direction.UP;
    }

    return null;
  } catch (err) {
    if (APP_CONFIG.IS_DEV) {
      console.error(LOG_MESSAGES.ROUTE_MISSING(routeid), err);
    }
    return null;
  }
}
