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
      {upPolyline.map((coords, idx) => {
        // 가까운 구간은 선명하게, 멀어질수록 흐리게 (최소값 보장)
        const dynamicOpacity = Math.max(1 - idx / upPolyline.length, 0.2);
        const finalOpacity = isInactive ? 0.3 : dynamicOpacity;

        return (
          <Polyline
            key={`up-${idx}`}
            positions={coords}
            pathOptions={{
              color: "red",
              weight: 4,
              dashArray: isInactive ? "4" : undefined,
              opacity: finalOpacity,
            }}
          />
        );
      })}

      {downPolyline.map((coords, idx) => {
        const dynamicOpacity = Math.max(1 - idx / downPolyline.length, 0.2);
        const finalOpacity = isInactive ? 0.3 : dynamicOpacity;

        return (
          <Polyline
            key={`down-${idx}`}
            positions={coords}
            pathOptions={{
              color: "blue",
              weight: 4,
              dashArray: isInactive ? "4" : undefined,
              opacity: finalOpacity,
            }}
          />
        );
      })}
    </>
  );
}
