// src/components/Map.tsx

'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import BusMarker from './BusMarker';
import MyLocation from './MyLocation';
import MapProvider from './MapWithProvider';
import BusStopMarker from './BusStopMarker';
import BusRoutePolyline from './BusRoutePolyline';

type MapProps = {
  routeId: string;
};

const defaultPosition: [number, number] = [37.278925, 127.902296];

export default function Map({ routeId }: MapProps) {
  return (
    <MapContainer
      center={defaultPosition}
      zoom={17}
      scrollWheelZoom={true}
      className="w-full h-[calc(100vh-3.5rem)] mt-14"
      style={{ paddingBottom: "56px" }}
    >
      <MapProvider>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BusMarker routeId={routeId} />
        <BusStopMarker routeId={routeId} />
        <BusRoutePolyline routeId={routeId} />
        <MyLocation />
      </MapProvider>
    </MapContainer>
  );
}