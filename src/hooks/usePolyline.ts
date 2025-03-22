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
    fetch(`/polylines/${routeName}.geojson`)
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [routeName]);

  const { upPolyline, downPolyline } = useMemo(() => {
    if (!data) return { upPolyline: [], downPolyline: [] };

    const upPolyline: [number, number][][] = [];
    const downPolyline: [number, number][][] = [];

    data.features.forEach((feature) => {
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
