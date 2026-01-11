// src/features/live/components/MapProvider.tsx

"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { useBusContext } from "@live/context/MapContext";

interface MapProviderProps {
  children: React.ReactNode;
}

export default function MapProvider({ children }: MapProviderProps) {
  const leafletMap = useMap();
  const { setMap } = useBusContext();

  useEffect(() => {
    if (leafletMap) {
      setMap(leafletMap);
    }
  }, [leafletMap, setMap]);

  return <>{children}</>;
}
