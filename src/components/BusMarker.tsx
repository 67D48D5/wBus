// src/components/BusMarker.tsx

"use client";

import L from "leaflet";
// 클라이언트 환경에서만 플러그인을 동적으로 로드합니다.
if (typeof window !== "undefined") {
  require("leaflet.marker.slideto");
}
import { useEffect, useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";

import { useIcons } from "@/hooks/useIcons";
import { useBusLocationData } from "@/hooks/useBusLocation";
import { getRouteInfo } from "@/utils/getRouteMap";
import { useBusDirection } from "@/hooks/useBusDirection";

import type { RouteInfo } from "@/types/data";

// leaflet.marker.slideto 모듈이 L.Marker.prototype에 slideTo 메서드를 추가하는지 확인합니다.
declare module "leaflet" {
  interface Marker {
    slideTo?: (latlng: L.LatLngExpression, options?: any) => this;
  }
}

export default function BusMarker({ routeName }: { routeName: string }) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const { busIconUp, busIconDown } = useIcons();

  // routeInfo 비동기 로드
  useEffect(() => {
    async function loadRouteInfo() {
      const info = await getRouteInfo(routeName);
      setRouteInfo(info);
    }
    loadRouteInfo();
  }, [routeName]);

  // 현재 운행중인 버스 목록과 방향 정보를 가져옵니다.
  const { data: busList } = useBusLocationData(routeName);
  const getDirection = useBusDirection(routeName);

  // 각 버스에 해당하는 마커 인스턴스를 저장할 레퍼런스
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // busList가 업데이트될 때 각 마커 위치를 slideTo 애니메이션으로 업데이트
  useEffect(() => {
    busList.forEach((bus) => {
      const key = `${bus.vehicleno}`;
      const marker = markerRefs.current[key];
      if (marker) {
        const newLatLng = L.latLng(bus.gpslati, bus.gpslong);
        if (!marker.getLatLng().equals(newLatLng)) {
          if (typeof marker.slideTo === "function") {
            marker.slideTo(newLatLng, { duration: 5000 });
          } else {
            // slideTo가 없으면 기본적으로 setLatLng로 대체
            marker.setLatLng(newLatLng);
          }
        }
      }
    });
  }, [busList]);

  // routeInfo가 없거나 버스 데이터가 없으면 아무것도 렌더링하지 않습니다.
  if (!routeInfo || busList.length === 0) return null;

  return (
    <>
      {busList.map((bus) => {
        const direction = getDirection(bus.nodeid, bus.nodeord);
        const icon = direction === 1 ? busIconDown : busIconUp;
        const key = `${bus.vehicleno}`;
        return (
          <Marker
            key={key}
            position={[bus.gpslati, bus.gpslong]}
            icon={icon}
            ref={(marker: L.Marker | null) => {
              if (marker) {
                markerRefs.current[key] = marker;
              }
            }}
          >
            <Popup>
              <div className="font-bold mb-1">
                {direction === 1 ? "⬆️" : "⬇️"} {routeName}번
              </div>
              {bus.vehicleno}, {bus.nodenm}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
