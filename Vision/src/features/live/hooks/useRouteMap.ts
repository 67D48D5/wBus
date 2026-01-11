// src/features/live/hooks/useRouteMap.ts

import { useEffect, useState, useRef } from "react";

import { ERROR_MESSAGES } from "@core/config/locale";

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
        console.error(ERROR_MESSAGES.ROUTE_MAP_FETCH_ERROR, err);
      });
  }, []);

  return data;
}
