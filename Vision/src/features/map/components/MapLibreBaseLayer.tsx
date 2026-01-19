// src/features/map/components/MapLibreBaseLayer.tsx

"use client";

import "@maplibre/maplibre-gl-leaflet"

import L from "leaflet";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import { APP_CONFIG } from "@core/config/env";

import { getMapStyle } from "@map/api/getMapData";

export default function MapLibreBaseLayer({ onReady }: { onReady?: () => void }) {
  const map = useMap();
  const mapLibreLayerRef = useRef<L.Layer | null>(null);
  const readyOnceRef = useRef(false);
  const readyCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!map || typeof window === "undefined") return;
    let isActive = true;

    const signalReady = () => {
      if (readyOnceRef.current) return;
      readyOnceRef.current = true;
      onReady?.();
    };

    const attachMapLibreReady = (layer: L.Layer) => {
      const maplibreLayer = layer as L.Layer & { getMap?: () => unknown };
      const maplibreMap = maplibreLayer.getMap?.() as
        | {
          on?: (event: string, handler: () => void) => void;
          once?: (event: string, handler: () => void) => void;
          off?: (event: string, handler: () => void) => void;
          loaded?: () => boolean;
          areTilesLoaded?: () => boolean;
          isStyleLoaded?: () => boolean;
        }
        | undefined;

      if (!maplibreMap) {
        signalReady();
        return;
      }

      const isFullyLoaded = () => {
        const styleReady = maplibreMap.isStyleLoaded?.() ?? maplibreMap.loaded?.() ?? true;
        const tilesReady = maplibreMap.areTilesLoaded?.() ?? maplibreMap.loaded?.() ?? true;
        return styleReady && tilesReady;
      };

      if (isFullyLoaded()) {
        signalReady();
        return;
      }

      const handleReady = () => {
        if (!isActive) return;
        if (!isFullyLoaded()) return;
        signalReady();
      };

      const bind = maplibreMap.once ?? maplibreMap.on;
      if (!bind) {
        signalReady();
        return;
      }

      bind("idle", handleReady);
      bind("load", handleReady);

      readyCleanupRef.current = () => {
        maplibreMap.off?.("idle", handleReady);
        maplibreMap.off?.("load", handleReady);
      };
    };

    const initializeMapLayer = async () => {
      try {
        const style = await getMapStyle();
        if (!isActive || mapLibreLayerRef.current) return;

        const maplibreLayer = L.maplibreGL({ style });
        maplibreLayer.addTo(map);
        mapLibreLayerRef.current = maplibreLayer;

        attachMapLibreReady(maplibreLayer);
      } catch (error) {
        if (APP_CONFIG.IS_DEV) {
          console.error("[MapLibreBaseLayer] Failed to load map style", error);
        }

        signalReady();
      }
    };

    map.whenReady(initializeMapLayer);

    return () => {
      isActive = false;
      if (readyCleanupRef.current) {
        readyCleanupRef.current();
        readyCleanupRef.current = null;
      }
      if (mapLibreLayerRef.current) {
        map.removeLayer(mapLibreLayerRef.current);
        mapLibreLayerRef.current = null;
      }
    };
  }, [map, onReady]);

  return null;
}
