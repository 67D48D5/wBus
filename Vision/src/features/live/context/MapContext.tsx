// src/features/live/context/MapContext.tsx

"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

import { ERROR_MESSAGES } from "@core/constants/locale";

import type { Map } from "leaflet";

type MapContextType = {
  map: Map | null;
  setMap: (map: Map | null) => void;
  selectedRoute: string | null;
  setSelectedRoute: (route: string | null) => void;
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
    throw new Error(ERROR_MESSAGES.USE_BUS_CONTEXT_ERROR);
  }
  return context;
}

/**
 * Provider component that maintains the Leaflet map instance globally.
 * Allows any child component to access the map instance via useBusContext hook.
 */
export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const value = useMemo(() => ({ map, setMap, selectedRoute, setSelectedRoute }), [map, selectedRoute]);
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
