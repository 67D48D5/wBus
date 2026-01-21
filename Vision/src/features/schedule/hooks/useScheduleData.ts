// src/features/schedule/hooks/useScheduleData.ts

"use client";

import { useEffect, useState } from "react";

import { fetchAPI, HttpError } from "@core/network/fetchAPI";

import { API_CONFIG, APP_CONFIG } from "@core/config/env";
import { UI_TEXT } from "@core/config/locale";

import type { BusSchedule } from "@core/domain/schedule";

// ----------------------------------------------------------------------
// Caching & Helpers
// ----------------------------------------------------------------------

/**
 * Global in-memory cache to store fetched schedules.
 * Persists across component re-renders and unmounts within the same session.
 */
const GlobalScheduleCache = new Map<string, BusSchedule | null>();

/**
 * Resolves the URL for the schedule JSON file.
 * Handles switching between remote API and local public directory based on config.
 */
function resolveScheduleUrl(routeId: string): string {
  const { USE_REMOTE, BASE_URL, PATHS } = API_CONFIG.STATIC;

  if (USE_REMOTE && BASE_URL) {
    return `${BASE_URL}/${PATHS.SCHEDULES}/${routeId}.json`;
  }

  return `/data/schedules/${routeId}.json`;
}

/**
 * Fetches the schedule data from the network.
 * Returns `null` if the file is not found (404/403), otherwise throws an error.
 */
async function fetchScheduleData(routeId: string): Promise<BusSchedule | null> {
  try {
    const url = resolveScheduleUrl(routeId);
    return await fetchAPI<BusSchedule>(url, { baseUrl: "", retries: 1 });
  } catch (error) {
    // Treat 404 (Not Found) or 403 (Forbidden) as "Data Missing" (null) rather than an error
    if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

// ----------------------------------------------------------------------
// Hook Definition
// ----------------------------------------------------------------------

/**
 * Custom hook to fetch and manage bus schedule data.
 * Includes caching, loading states, and error handling.
 *
 * @param routeId - The ID of the route to fetch (e.g., "34-1"). Pass null to reset.
 */
export function useScheduleData(routeId: string | null) {
  const [data, setData] = useState<BusSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    // Flag to prevent state updates if the component unmounts or routeId changes
    let isActive = true;

    // 1. Reset state if no routeId is provided
    if (!routeId) {
      setData(null);
      setError(null);
      setMissing(false);
      setLoading(false);
      return;
    }

    // 2. Check Cache First
    const cachedData = GlobalScheduleCache.get(routeId);
    if (cachedData !== undefined) {
      setData(cachedData);
      setError(null);
      setMissing(cachedData === null);
      setLoading(false);
      return;
    }

    // 3. Init Fetch
    setLoading(true);
    setError(null);
    setMissing(false);

    fetchScheduleData(routeId)
      .then((result) => {
        if (!isActive) return;

        // Update Cache
        GlobalScheduleCache.set(routeId, result);

        // Update State
        setData(result);
        setMissing(result === null);
      })
      .catch((err) => {
        if (!isActive) return;

        // Log error in Dev mode
        if (APP_CONFIG.IS_DEV) {
          console.error(UI_TEXT.ERROR.FETCH_FAILED("Schedule Data", 500), err);
        }

        setError(UI_TEXT.ERROR.UNKNOWN(err instanceof Error ? err.message : String(err)));
        setMissing(false); // It's an error, not necessarily "missing"
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    // Cleanup function
    return () => {
      isActive = false;
    };
  }, [routeId]);

  return { data, loading, error, missing };
}
