// src/context/MapContext.tsx

"use client";

import { createContext, useContext } from 'react';
import type { Map } from 'leaflet';

export const MapContext = createContext<Map | null>(null);

export const useMapContext = () => useContext(MapContext);
