// src/features/map/components/Map.tsx

"use client";

import {
  MAP_URL,
  MAP_ATTRIBUTION,
  MAP_DEFAULT_ZOOM,
  MAP_DEFAULT_POSITION,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
} from "@core/constants/env";

import { MapContainer, TileLayer } from "react-leaflet";

import MapProvider from "./MapWithProvider";

import BusMarker from "@bus/components/BusMarker";
import BusStopMarker from "@bus/components/BusStopMarker";
import BusRoutePolyline from "@bus/components/BusRoutePolyline";

type MapProps = {
  routeName: string;
};

const defaultPosition: [number, number] = (() => {
  const position = String(MAP_DEFAULT_POSITION).split(",").map(Number);
  return position.length === 2 ? [position[0], position[1]] : [0, 0];
})();

// @TODO: Move to constants file (max bounds, etc.)
export default function Map({ routeName }: MapProps) {
  return (
    <MapContainer
      center={defaultPosition}
      zoom={MAP_DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="w-full h-full"
      maxBounds={[
        [37.22, 127.8],
        [37.52, 128.05],
      ]}
      maxBoundsViscosity={1.0}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
    >
      <MapProvider>
        <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_URL} maxZoom={19} />
        <BusMarker routeName={routeName} />
        <BusStopMarker routeName={routeName} />
        <BusRoutePolyline routeName={routeName} />
      </MapProvider>
    </MapContainer>
  );
}
