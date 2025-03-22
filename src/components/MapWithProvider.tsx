// src/components/MapWithProvider.tsx

"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useMapContext } from "@/context/MapContext";

export default function MapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const leafletMap = useMap(); // Leaflet map 인스턴스
  const { setMap } = useMapContext(); // 전역 컨텍스트에 setMap 사용

  useEffect(() => {
    if (leafletMap) {
      setMap(leafletMap);
    }
  }, [leafletMap]);

  return <>{children}</>;
}
