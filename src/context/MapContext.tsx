// src/context/MapContext.tsx

"use client";

import { createContext, useContext, useState } from "react";
import type { Map } from "leaflet";

type MapContextType = {
  map: Map | null;
  setMap: (map: Map) => void;
};

export const MapContext = createContext<MapContextType | undefined>(undefined);

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
}

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map | null>(null);

  return (
    <MapContext.Provider value={{ map, setMap }}>
      {children}
    </MapContext.Provider>
  );
}
