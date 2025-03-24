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
      center={[37.278925, 127.902296]}
      zoom={17}
      scrollWheelZoom={true}
      className="w-full h-full"
      maxBounds={[
        [37.22, 127.8],
        [37.52, 128.05],
      ]}
      maxBoundsViscosity={1.0}
      minZoom={12}
      maxZoom={19}
    >
      <MapProvider>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <BusMarker routeName={routeName} />
        <BusStopMarker routeName={routeName} />
        <BusRoutePolyline routeName={routeName} />
      </MapProvider>
    </MapContainer>
  );
}
