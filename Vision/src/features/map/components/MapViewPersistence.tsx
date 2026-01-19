// src/features/map/components/MapViewPersistence.tsx

"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { createMapViewFromMap, saveMapView } from "@map/utils/mapViewStorage";

export default function MapViewPersistence() {
  const map = useMap();

  useEffect(() => {
    const saveView = () => {
      saveMapView(createMapViewFromMap(map));
    };

    map.on("moveend", saveView);

    return () => {
      map.off("moveend", saveView);
    };
  }, [map]);

  return null;
}
