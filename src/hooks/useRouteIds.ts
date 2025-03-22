// src/hooks/useRouteIds.ts

import { useEffect, useState } from "react";

let cached: Record<string, string[]> | null = null;
let loading = false;
let listeners: ((data: Record<string, string[]>) => void)[] = [];

export function useRouteIds(): Record<string, string[]> | null {
  const [data, setData] = useState(cached);

  useEffect(() => {
    if (cached) {
      setData(cached);
      return;
    }

    if (loading) {
      listeners.push(setData);
      return;
    }

    loading = true;
    fetch("/routeIds.json")
      .then((res) => res.json())
      .then((json) => {
        cached = json;
        setData(json);
        listeners.forEach((fn) => fn(json));
        listeners = [];
      })
      .catch((err) => {
        console.error("❌ routeIds.json load error:", err);
      });
  }, []);

  return data;
}
