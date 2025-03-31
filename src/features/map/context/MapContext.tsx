// src/context/MapContext.tsx

"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import type { Map } from "leaflet";

type MapContextType = {
  map: Map | null;
  setMap: (map: Map | null) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export function useMapContext(): MapContextType {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within MapProvider");
  }
  return context;
}

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map | null>(null);
  // context value를 memoization하여 불필요한 리렌더링을 방지합니다.
  const value = useMemo(() => ({ map, setMap }), [map]);
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
