// src/features/bus/hooks/useRouteMap.ts

import { useEffect, useState, useRef } from "react";

import { getRouteMap } from "@bus/api/getRouteMap";

/**
 * Get (routeName) -> routeIds[] mapping for bus routes.
 *
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
        console.error("Failed to fetch route map:", err);
      });
  }, []);

  return data;
}
