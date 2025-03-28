// src/hooks/usePolyline.ts

import { useEffect, useState, useMemo } from "react";

type GeoFeature = {
  type: "Feature";
  properties: { linkId: number; linkOrd: number; updnDir: string };
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

type PolylineData = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

export function usePolyline(routeName: string) {
  const [data, setData] = useState<PolylineData | null>(null);

  useEffect(() => {
    // 비동기 데이터 fetch 함수 정의 (에러 처리 추가)
    const fetchPolyline = async () => {
      try {
        const res = await fetch(`/polylines/${routeName}.geojson`);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("❌ Polyline fetch error:", error);
      }
    };

    fetchPolyline();
  }, [routeName]);

  // data가 존재할 때, updnDir 값에 따라 좌표를 분리합니다.
  // GeoJSON 좌표는 [lng, lat] 순서이므로, [lat, lng]로 변환합니다.
  const { upPolyline, downPolyline } = useMemo(() => {
    if (!data) return { upPolyline: [], downPolyline: [] };

    const upPolyline: [number, number][][] = [];
    const downPolyline: [number, number][][] = [];

    data.features.forEach((feature) => {
      // 좌표 배열을 [lat, lng] 순서로 변환
      const coords = feature.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      const dir = feature.properties.updnDir;
      if (dir === "1") {
        upPolyline.push(coords);
      } else if (dir === "0") {
        downPolyline.push(coords);
      }
    });

    return { upPolyline, downPolyline };
  }, [data]);

  return { upPolyline, downPolyline };
}
