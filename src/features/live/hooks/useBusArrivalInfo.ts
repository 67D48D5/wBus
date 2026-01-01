// src/features/live/hooks/useBusArrivalInfo.ts

import { useEffect, useState, useRef, useCallback } from "react";

import { API_REFRESH_INTERVAL } from "@core/constants/env";
import { getBusArrivalInfoData } from "@live/api/getRealtimeData";
import type { ArrivalInfo } from "@live/models/data";

export function useBusArrivalInfo(busStopId: string | null) {
  const [data, setData] = useState<ArrivalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A ref to keep track of the timer without causing re-renders
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use useCallback to memoize the fetchData function
  const fetchData = useCallback(async () => {
    // Only fetch if a valid busStopId is provided
    if (!busStopId || busStopId.trim() === "") {
      setData([]); // Clear data if busStopId becomes invalid
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getBusArrivalInfoData(busStopId);
      setData(result);
    } catch (e) {
      console.error(e);
      setError("도착 정보를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [busStopId]);

  useEffect(() => {
    // Clear any existing timer when busStopId changes
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Don't start a new fetch cycle if busStopId is invalid
    if (!busStopId || busStopId.trim() === "") {
      setData([]);
      return;
    }

    // Initial data fetch
    fetchData();

    // Start a new timer for periodic fetches
    timerRef.current = setInterval(fetchData, API_REFRESH_INTERVAL);

    // Cleanup on unmount or busStopId change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [busStopId, fetchData]); // fetchData is stable due to useCallback

  return { data, loading, error };
}

// For extracting arrival info for a specific route in a simple way
export function getNextBusArrivalInfo(routeName: string, data: ArrivalInfo[]) {
  // Use a more robust check to handle different route formats
  const target = data.find((bus) =>
    bus.routeno.replace(/-/g, "").trim() === routeName.replace(/-/g, "").trim()
  );

  if (!target) return null;

  return {
    minutes: Math.ceil(target.arrtime / 60),
    stopsAway: target.arrprevstationcnt,
  };
}
