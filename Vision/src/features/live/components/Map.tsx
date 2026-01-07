// src/features/live/components/Map.tsx

"use client";

import React, { useCallback, useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

import {
  MAP_URL,
  MAP_ATTRIBUTION,
  MAP_DEFAULT_ZOOM,
  MAP_DEFAULT_POSITION,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MAX_BOUNDS,
} from "@core/constants/env";

import MapProvider from "./MapWithProvider";

import { useBusContext } from "@live/context/MapContext";

import BusMarker from "@live/components/BusMarker";
import BusStopMarker from "@live/components/BusStopMarker";
import BusRoutePolyline from "@live/components/BusRoutePolyline";

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

RouteMarkers.displayName = 'RouteMarkers';

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
    center: MAP_DEFAULT_POSITION,
    zoom: MAP_DEFAULT_ZOOM,
    scrollWheelZoom: true,
    maxBounds: MAP_MAX_BOUNDS,
    maxBoundsViscosity: 1.0,
    minZoom: MAP_MIN_ZOOM,
    maxZoom: MAP_MAX_ZOOM,
  }), []);

  return (
    <MapContainer
      {...mapOptions}
      className="w-full h-full"
    >
      <MapProvider>
        <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_URL} maxZoom={MAP_MAX_ZOOM} />
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
