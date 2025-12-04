// src/features/map/components/Map.tsx

"use client";

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
  routeName: string;
};

export default function Map({ routeName }: MapProps) {
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
        <BusMarker routeName={routeName} />
        <BusStopMarker routeName={routeName} />
        <BusRoutePolyline routeName={routeName} />
      </MapProvider>
    </MapContainer>
  );
}
