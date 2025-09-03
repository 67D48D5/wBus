// src/features/map/components/MapWithProvider.tsx

"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { useMapContext } from "@map/context/MapContext";

interface MapWithProviderProps {
  children: React.ReactNode;
}

export default function MapWithProvider({ children }: MapWithProviderProps) {
  const leafletMap = useMap();
  const { setMap } = useMapContext();

  useEffect(() => {
    if (leafletMap) {
      setMap(leafletMap);
    }
  }, [leafletMap, setMap]);

  return <>{children}</>;
}
