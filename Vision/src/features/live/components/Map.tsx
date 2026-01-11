// src/features/live/components/Map.tsx

"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import "@maplibre/maplibre-gl-leaflet";
import React, { useCallback, useMemo, useEffect, useRef } from "react";
import { MapContainer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";

import { MAP_SETTINGS } from "@core/config/env";

import { getMapStyle } from "@live/api/getStaticData";
import { useBusContext } from "@live/context/MapContext";

import BusMarker from "@live/components/BusMarker";
import BusStopMarker from "@live/components/BusStopMarker";
import BusRoutePolyline from "@live/components/BusRoutePolyline";
import MapProvider from "@live/components/MapProvider";

type MapProps = {
  routeNames: string[];
};

/**
 * Memoized route marker component to prevent unnecessary re-renders
 */
const RouteMarkers = React.memo(({
  routeName,
  onPopupOpen,
  onPopupClose
}: {
  routeName: string;
  onPopupOpen: (routeName: string) => void;
  onPopupClose: () => void;
}) => (
  <>
    <BusMarker
      routeName={routeName}
      onPopupOpen={onPopupOpen}
      onPopupClose={onPopupClose}
    />
    <BusStopMarker routeName={routeName} />
    <BusRoutePolyline routeName={routeName} />
  </>
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.routeName === nextProps.routeName &&
    prevProps.onPopupOpen === nextProps.onPopupOpen &&
    prevProps.onPopupClose === nextProps.onPopupClose
  );
});

RouteMarkers.displayName = "RouteMarkers";

/**
 * MapLibre GL base layer component
 */
const MapLibreBaseLayer = React.memo(() => {
  const map = useMap();
  const mapLibreLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!map || typeof window === "undefined") return;
    let isActive = true;

    const initializeMapLayer = async () => {
      try {
        const style = await getMapStyle();
        if (!isActive || mapLibreLayerRef.current) return;
        const maplibreLayer = L.maplibreGL({
          style,
        });

        maplibreLayer.addTo(map);
        mapLibreLayerRef.current = maplibreLayer;
      } catch (error) {
        console.error("[MapLibreBaseLayer] Failed to load map style", error);
      }
    };

    map.whenReady(initializeMapLayer);

    return () => {
      isActive = false;
      if (mapLibreLayerRef.current) {
        map.removeLayer(mapLibreLayerRef.current);
        mapLibreLayerRef.current = null;
      }
    };
  }, [map]);

  return null;
});

MapLibreBaseLayer.displayName = "MapLibreBaseLayer";

export default function Map({ routeNames }: MapProps) {
  const { setSelectedRoute } = useBusContext();

  const handlePopupOpen = useCallback((routeName: string) => {
    setSelectedRoute(routeName);
  }, [setSelectedRoute]);

  const handlePopupClose = useCallback(() => {
    setSelectedRoute(null);
  }, [setSelectedRoute]);

  // Memoize map options to prevent unnecessary re-renders
  const mapOptions = useMemo(() => ({
    center: MAP_SETTINGS.DEFAULT_POSITION,
    zoom: MAP_SETTINGS.ZOOM.DEFAULT,
    scrollWheelZoom: true,
    preferCanvas: true,
    maxBounds: MAP_SETTINGS.MAX_BOUNDS,
    maxBoundsViscosity: 1.0,
    minZoom: MAP_SETTINGS.ZOOM.MIN,
    maxZoom: MAP_SETTINGS.ZOOM.MAX,
    zoomControl: false,
  }), []);

  return (
    <MapContainer
      {...mapOptions}
      className="w-full h-full"
    >
      <ZoomControl position="topright" />
      <MapProvider>
        <MapLibreBaseLayer />
        {routeNames.map((routeName) => (
          <RouteMarkers
            key={routeName}
            routeName={routeName}
            onPopupOpen={handlePopupOpen}
            onPopupClose={handlePopupClose}
          />
        ))}
      </MapProvider>
    </MapContainer>
  );
}
