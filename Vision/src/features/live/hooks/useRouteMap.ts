// src/features/live/hooks/useRouteMap.ts

import { useEffect, useState, useRef } from "react";

import { APP_CONFIG } from "@core/config/env";
import { LOG_MESSAGES } from "@core/config/locale";

import { getRouteMap } from "@live/api/getStaticData";

/**
 * Get (routeName) -> routeIds[] mapping for bus routes.
 * Example: { "30": ["30100123", "30100124"] }
 */
export function useRouteMap(): Record<string, string[]> | null {
  const [data, setData] = useState<Record<string, string[]> | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    getRouteMap()
      .then((map) => {
        setData(map);
      })
      .catch((err) => {
        if (APP_CONFIG.IS_DEV)
          console.error(LOG_MESSAGES.FETCH_FAILED("RouteMap", 500), err);
      });
  }, []);

  return data;
}
