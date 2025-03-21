// src/components/MapWithProvider.tsx

'use client';

import { useMap } from 'react-leaflet';
import { MapContext } from '@/context/MapContext';

export default function MapProvider({ children }: { children: React.ReactNode }) {
  const map = useMap();
  
  return <MapContext.Provider value={map}>{children}</MapContext.Provider>;
}