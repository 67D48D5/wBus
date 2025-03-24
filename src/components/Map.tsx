// src/components/Map.tsx

"use client";

import { MapContainer, TileLayer } from "react-leaflet";

import BusMarker from "./BusMarker";
import MapProvider from "./MapWithProvider";
import BusStopMarker from "./BusStopMarker";
import BusRoutePolyline from "./BusRoutePolyline";

type MapProps = {
  routeName: string;
};

const defaultPosition: [number, number] = [37.278925, 127.902296];

export default function Map({ routeName }: MapProps) {
  return (
    <MapContainer
      center={defaultPosition}
      zoom={17}
      scrollWheelZoom={true}
      className="w-full h-[calc(100vh-3.5rem)] mt-14 z-0 !z-0"
    >
      <MapProvider>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BusMarker routeName={routeName} />
        <BusStopMarker routeName={routeName} />
        <BusRoutePolyline routeName={routeName} />
      </MapProvider>
    </MapContainer>
  );
}
