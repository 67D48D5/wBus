// src/features/live/components/Map.tsx

"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import React, { useCallback, useMemo, useRef } from "react";
import { MapContainer, ZoomControl } from "react-leaflet";

import { MAP_SETTINGS } from "@core/config/env";

import BusMarker from "@live/components/BusMarker";
import BusStopMarker from "@live/components/BusStopMarker";
import BusRoutePolyline from "@live/components/BusRoutePolyline";
import MapContextBridge from "@live/components/MapContextBridge";
import MapLibreBaseLayer from "@live/components/MapLibreBaseLayer";
import MapViewPersistence from "@live/components/MapViewPersistence";

import { getInitialMapView } from "@live/utils/mapViewStorage";

type MapProps = {
  routeNames: string[];
  onReady?: () => void;
  onRouteChange?: (routeName: string) => void;
};

/**
 * Memoized route marker component to prevent unnecessary re-renders
 */
const RouteMarkers = React.memo(({
  routeName,
  onRouteChange
}: {
  routeName: string;
  onRouteChange?: (routeName: string) => void;
}) => (
  <>
    <BusMarker
      routeName={routeName}
    />
    <BusStopMarker
      routeName={routeName}
      onRouteChange={onRouteChange}
    />
    <BusRoutePolyline routeName={routeName} />
  </>
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.routeName === nextProps.routeName
    && prevProps.onRouteChange === nextProps.onRouteChange
  );
});

RouteMarkers.displayName = "RouteMarkers";

export default function Map({ routeNames, onReady, onRouteChange }: MapProps) {
  const readyOnceRef = useRef(false);
  const handleReadyOnce = useCallback(() => {
    if (readyOnceRef.current) return;
    readyOnceRef.current = true;
    onReady?.();
  }, [onReady]);
  const initialView = useMemo(() => getInitialMapView(), []);

  // Memoize map options to prevent unnecessary re-renders
  const mapOptions = useMemo(() => ({
    center: initialView.center,
    zoom: initialView.zoom,
    minZoom: MAP_SETTINGS.ZOOM.MIN,
    maxZoom: MAP_SETTINGS.ZOOM.MAX,
    maxBounds: MAP_SETTINGS.MAX_BOUNDS,
    maxBoundsViscosity: 1.0,
    scrollWheelZoom: true,
    preferCanvas: true,
    zoomControl: false,
  }), [initialView]);

  return (
    <MapContainer
      {...mapOptions}
      className="w-full h-full"
    >
      <ZoomControl position="topright" />
      <MapContextBridge>
        <MapLibreBaseLayer onReady={handleReadyOnce} />
        <MapViewPersistence />
        {routeNames.map((routeName) => (
          <RouteMarkers
            key={routeName}
            routeName={routeName}
            onRouteChange={onRouteChange}
          />
        ))}
      </MapContextBridge>
    </MapContainer>
  );
}
