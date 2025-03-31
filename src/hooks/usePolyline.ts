// src/hooks/usePolyline.ts

import { useEffect, useState, useMemo } from "react";
import {
  getPolyline,
  transformPolyline,
  GeoPolylineData,
} from "@/utils/getPolyline";

export function usePolyline(routeName: string) {
  const [data, setData] = useState<GeoPolylineData | null>(null);

  useEffect(() => {
    getPolyline(routeName)
      .then((json) => setData(json))
      .catch((error) => console.error("❌ Polyline fetch error:", error));
  }, [routeName]);

  // 데이터가 로드되었을 경우 좌표 변환 수행
  const { upPolyline, downPolyline } = useMemo(() => {
    if (!data) return { upPolyline: [], downPolyline: [] };
    return transformPolyline(data);
  }, [data]);

  return { upPolyline, downPolyline };
}
