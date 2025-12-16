// src/features/map/components/Map.tsx

"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  MAP_URL,
  MAP_ATTRIBUTION,
  MAP_DEFAULT_ZOOM,
  MAP_DEFAULT_POSITION,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MAX_BOUNDS,
} from "@core/constants/env";

import { MapContainer, TileLayer } from "react-leaflet";

import MapProvider from "./MapWithProvider";

import BusMarker from "@bus/components/BusMarker";
import BusStopMarker from "@bus/components/BusStopMarker";
import BusRoutePolyline from "@bus/components/BusRoutePolyline";

type MapProps = {
  routeNames: string[];
};

/**
 * Memoized route marker component to prevent unnecessary re-renders
 */
const RouteMarkers = React.memo(({ 
  routeName, 
  selectedRoute,
  onPopupOpen, 
  onPopupClose 
}: { 
  routeName: string;
  selectedRoute: string | null;
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
    {selectedRoute === routeName && (
      <BusRoutePolyline routeName={routeName} />
    )}
  </>
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.routeName === nextProps.routeName &&
    prevProps.selectedRoute === nextProps.selectedRoute &&
    prevProps.onPopupOpen === nextProps.onPopupOpen &&
    prevProps.onPopupClose === nextProps.onPopupClose
  );
});

RouteMarkers.displayName = 'RouteMarkers';

export default function Map({ routeNames }: MapProps) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const handlePopupOpen = useCallback((routeName: string) => {
    setSelectedRoute(routeName);
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedRoute(null);
  }, []);

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
            selectedRoute={selectedRoute}
            onPopupOpen={handlePopupOpen}
            onPopupClose={handlePopupClose}
          />
        ))}
      </MapProvider>
    </MapContainer>
  );
}
