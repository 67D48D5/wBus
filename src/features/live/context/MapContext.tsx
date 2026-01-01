// src/features/live/context/MapContext.tsx

"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

import type { Map } from "leaflet";

type MapContextType = {
  map: Map | null;
  setMap: (map: Map | null) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

/**
 * Custom hook to access the map context.
 * Must be used within a MapProvider component.
 * @throws Error if used outside of MapProvider
 * @returns The map context containing the map instance and setter
 */
export function useBusContext(): MapContextType {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useBusContext must be used within MapProvider");
  }
  return context;
}

/**
 * Provider component that maintains the Leaflet map instance globally.
 * Allows any child component to access the map instance via useBusContext hook.
 */
export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map | null>(null);
  const value = useMemo(() => ({ map, setMap }), [map]);
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
