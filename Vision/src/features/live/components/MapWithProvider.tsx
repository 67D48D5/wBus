// src/features/live/components/MapWithProvider.tsx

"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { useBusContext } from "@live/context/MapContext";

interface MapWithProviderProps {
  children: React.ReactNode;
}

export default function MapWithProvider({ children }: MapWithProviderProps) {
  const leafletMap = useMap();
  const { setMap } = useBusContext();

  useEffect(() => {
    if (leafletMap) {
      setMap(leafletMap);
    }
  }, [leafletMap, setMap]);

  return <>{children}</>;
}
