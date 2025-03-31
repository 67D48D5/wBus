// src/components/Map.tsx

"use client";

import { MapContainer, TileLayer } from "react-leaflet";

import MapProvider from "./MapWithProvider";

import BusMarker from "@bus/components/BusMarker";
import BusStopMarker from "@bus/components/BusStopMarker";
import BusRoutePolyline from "@bus/components/BusRoutePolyline";

type MapProps = {
  routeName: string;
};

// 환경 변수에서 기본 위치(위도, 경도)를 문자열로 가져옵니다.
const defaultPositionString = process.env.NEXT_PUBLIC_DEFAULT_POSITION;
if (!defaultPositionString) {
  throw new Error(
    "NEXT_PUBLIC_DEFAULT_POSITION 환경 변수가 설정되지 않았습니다."
  );
}

// 문자열을 쉼표로 분리하여 숫자 배열로 변환 후, [lat, lng] 튜플로 지정합니다.
const [lat, lng] = defaultPositionString.split(",").map(Number);
const defaultPosition: [number, number] = [lat, lng];

export default function Map({ routeName }: MapProps) {
  return (
    <MapContainer
      center={defaultPosition}
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
