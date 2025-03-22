// src/hooks/useRouteMap.ts

import { useEffect, useState } from "react";
import { getRouteMap } from "@/utils/getRouteInfo";

export function useRouteMap(): Record<string, string[]> | null {
  const [data, setData] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    let isMounted = true;

    getRouteMap()
      .then((map) => {
        if (isMounted) {
          setData(map);
        }
      })
      .catch((err) => {
        console.error("❌ useRouteMap fetch error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return data;
}
