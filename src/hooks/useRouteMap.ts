// src/hooks/useRouteMap.ts

import { useEffect, useState } from "react";
import { getRouteMap } from "@/utils/getRouteMap";

export function useRouteMap(): Record<string, string[]> | null {
  const [data, setData] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRouteMap = async () => {
      try {
        const map = await getRouteMap();
        if (isMounted) {
          setData(map);
        }
      } catch (err) {
        console.error("❌ useRouteMap fetch error:", err);
      }
    };

    fetchRouteMap();

    return () => {
      isMounted = false;
    };
  }, []);

  return data;
}
