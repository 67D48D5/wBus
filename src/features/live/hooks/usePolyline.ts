// src/features/live/hooks/usePolyline.ts

import { useEffect, useState, useMemo } from "react";

import { getPolyline, transformPolyline } from "@live/api/getPolyline";

import type { GeoPolylineData } from "@live/models/data";

export function usePolyline(routeName: string) {
  const [data, setData] = useState<GeoPolylineData | null>(null);

  useEffect(() => {
    getPolyline(routeName)
      .then((json) => setData(json))
      .catch((error) => console.error("❌ Polyline fetch error:", error));
  }, [routeName]);

  const { upPolyline, downPolyline } = useMemo(() => {
    if (!data) return { upPolyline: [], downPolyline: [] };
    return transformPolyline(data);
  }, [data]);

  return { upPolyline, downPolyline };
}
