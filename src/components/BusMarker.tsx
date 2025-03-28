// src/components/BusMarker.tsx

"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { useIcons } from "@/hooks/useIcons";
import { useBusData } from "@/hooks/useBusData";
import { getRouteInfo } from "@/utils/getRouteInfo";
import { useBusDirection } from "@/hooks/useBusDirection";

import type { RouteInfo } from "@/types/data";

type BusMarkerProps = {
  routeName: string;
};

export default function BusMarker({ routeName }: BusMarkerProps) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const { busIconUp, busIconDown } = useIcons();

  // 비동기적으로 routeInfo를 불러와 상태에 저장합니다.
  useEffect(() => {
    const loadRouteInfo = async () => {
      const info = await getRouteInfo(routeName);
      setRouteInfo(info);
    };
    loadRouteInfo();
  }, [routeName]);

  // 현재 운행중인 버스 목록과 방향 정보를 가져옵니다.
  const { data: busList } = useBusData(routeName);
  const getDirection = useBusDirection(routeName);

  // routeInfo가 없거나, 운행 버스가 없으면 아무것도 렌더링하지 않습니다.
  if (!routeInfo || busList.length === 0) return null;

  return (
    <>
      {busList.map((bus) => {
        // 버스의 방향을 판별합니다.
        const direction = getDirection(bus.nodeid, bus.nodeord);
        // 방향 코드가 1이면 하행 아이콘, 그렇지 않으면 상행 아이콘을 사용합니다.
        const icon = direction === 1 ? busIconDown : busIconUp;

        return (
          <Marker
            key={`${bus.vehicleno}-${bus.gpslati}-${bus.gpslong}`}
            position={[bus.gpslati, bus.gpslong]}
            icon={icon}
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
