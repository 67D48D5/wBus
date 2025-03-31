// src/components/MapWithProvider.tsx

"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { useMapContext } from "@map/context/MapContext";

interface MapWithProviderProps {
  children: React.ReactNode;
}

/**
 * MapWithProvider 컴포넌트는 react-leaflet의 지도 인스턴스를 전역 MapContext에 등록합니다.
 * 이를 통해 자식 컴포넌트들이 전역에서 지도 인스턴스를 사용할 수 있습니다.
 */
export default function MapWithProvider({ children }: MapWithProviderProps) {
  const leafletMap = useMap(); // react-leaflet에서 제공하는 지도 인스턴스
  const { setMap } = useMapContext(); // 전역 MapContext의 setMap 함수

  useEffect(() => {
    if (leafletMap) {
      setMap(leafletMap);
    }
  }, [leafletMap, setMap]);

  return <>{children}</>;
}
