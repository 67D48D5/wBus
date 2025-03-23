// src/components/BusRoutePolyline.tsx

"use client";

import { Polyline } from "react-leaflet";
import { usePolyline } from "@/hooks/usePolyline";
import { useBusData } from "@/hooks/useBusData"; // 추가

type Props = {
  routeName: string;
};

export default function BusRoutePolyline({ routeName }: Props) {
  const { upPolyline, downPolyline } = usePolyline(routeName);
  const { data: busList } = useBusData(routeName); // 현재 운행 차량 확인

  const isInactive = busList.length === 0; // 운행 차량 없으면 흐리게

  return (
    <>
      {upPolyline.map((coords, idx) => (
        <Polyline
          key={`up-${idx}`}
          positions={coords}
          pathOptions={{
            color: "red",
            weight: 4,
            dashArray: isInactive ? "4" : undefined,
            opacity: isInactive ? 0.3 : 1, // 흐림 처리
          }}
        />
      ))}

      {downPolyline.map((coords, idx) => (
        <Polyline
          key={`down-${idx}`}
          positions={coords}
          pathOptions={{
            color: "blue",
            weight: 4,
            dashArray: isInactive ? "4" : undefined, // 점선 처리
            opacity: isInactive ? 0.3 : 1, // 흐림 처리
          }}
        />
      ))}
    </>
  );
}
