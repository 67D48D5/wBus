// src/features/live/components/MapContextBridge.tsx

"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { useBusContext } from "@live/context/MapContext";

interface MapContextBridgeProps {
  children: React.ReactNode;
}

export default function MapContextBridge({ children }: MapContextBridgeProps) {
  const map = useMap();
  const { setMap } = useBusContext();

  useEffect(() => {
    setMap(map);
    return () => {
      setMap(null);
    };
  }, [map, setMap]);

  return <>{children}</>;
}
