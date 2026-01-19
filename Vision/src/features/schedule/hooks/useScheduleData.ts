// src/features/schedule/hooks/useScheduleData.ts

"use client";

import { useEffect, useState } from "react";

import { API_CONFIG, APP_CONFIG } from "@core/config/env";
import { LOG_MESSAGES, UI_TEXT } from "@core/config/locale";

import { fetchAPI, HttpError } from "@core/network/fetchAPI";

import { BusData } from "@core/domain/schedule";

const scheduleCache = new Map<string, BusData | null>();

function getScheduleUrl(routeId: string): string {
  if (API_CONFIG.STATIC.USE_REMOTE && API_CONFIG.STATIC.BASE_URL) {
    return `${API_CONFIG.STATIC.BASE_URL}/${API_CONFIG.STATIC.PATHS.SCHEDULES}/${routeId}.json`;
  }

  return `/data/schedules/${routeId}.json`;
}

async function fetchSchedule(routeId: string): Promise<BusData | null> {
  try {
    return await fetchAPI<BusData>(getScheduleUrl(routeId), { baseUrl: "", retries: 1 });
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function useScheduleData(routeId: string | null) {
  const [data, setData] = useState<BusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!routeId) {
      setData(null);
      setError(null);
      setMissing(false);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    const cached = scheduleCache.get(routeId);
    if (cached !== undefined) {
      setData(cached);
      setError(null);
      setMissing(cached === null);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    setLoading(true);
    setError(null);
    setMissing(false);

    fetchSchedule(routeId)
      .then((result) => {
        if (!isActive) return;
        scheduleCache.set(routeId, result);
        setData(result);
        setMissing(result === null);
      })
      .catch((err) => {
        if (!isActive) return;
        if (APP_CONFIG.IS_DEV) {
          console.error(LOG_MESSAGES.FETCH_FAILED(routeId, 500), err);
        }
        setError(UI_TEXT.ERROR.UNKNOWN);
        setMissing(false);
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [routeId]);

  return { data, loading, error, missing };
}
