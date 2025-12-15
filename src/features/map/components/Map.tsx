// src/features/map/components/Map.tsx

"use client";

import React, { useState, useCallback } from "react";
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

export default function Map({ routeNames }: MapProps) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const handlePopupOpen = useCallback((routeName: string) => {
    setSelectedRoute(routeName);
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedRoute(null);
  }, []);

  return (
    <MapContainer
      center={MAP_DEFAULT_POSITION}
      zoom={MAP_DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="w-full h-full"
      maxBounds={MAP_MAX_BOUNDS}
      maxBoundsViscosity={1.0}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
    >
      <MapProvider>
        <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_URL} maxZoom={MAP_MAX_ZOOM} />
        {routeNames.map((routeName) => (
          <React.Fragment key={routeName}>
            <BusMarker 
              routeName={routeName} 
              onPopupOpen={handlePopupOpen}
              onPopupClose={handlePopupClose}
            />
            <BusStopMarker routeName={routeName} />
            {selectedRoute === routeName && (
              <BusRoutePolyline routeName={routeName} />
            )}
          </React.Fragment>
        ))}
      </MapProvider>
    </MapContainer>
  );
}
