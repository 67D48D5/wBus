// src/components/BusRoutePolyline.tsx

"use client";

import { Polyline } from "react-leaflet";
import { usePolyline } from "@/hooks/usePolyline";
import { useBusLocationData } from "@/hooks/useBusLocation";

type Props = {
  routeName: string;
};

/**
 * 주어진 인덱스와 총 개수를 기반으로 동적 투명도를 계산합니다.
 * 운행 차량이 없으면(비활성 상태) 고정 투명도 0.3을 반환합니다.
 *
 * @param idx 현재 polyline의 인덱스
 * @param total 전체 polyline 개수
 * @param isInactive 운행 차량이 없는 경우 true
 * @returns 계산된 투명도 값
 */
function computeOpacity(
  idx: number,
  total: number,
  isInactive: boolean
): number {
  const dynamicOpacity = Math.max(1 - idx / total, 0.2);
  return isInactive ? 0.3 : dynamicOpacity;
}

export default function BusRoutePolyline({ routeName }: Props) {
  const { upPolyline, downPolyline } = usePolyline(routeName);
  const { data: busList } = useBusLocationData(routeName);

  // 운행 차량이 없으면 전체 경로를 흐리게 표시
  const isInactive = busList.length === 0;

  return (
    <>
      {upPolyline.map((coords, idx) => {
        const opacity = computeOpacity(idx, upPolyline.length, isInactive);
        return (
          <Polyline
            key={`up-${idx}`}
            positions={coords}
            pathOptions={{
              color: "blue",
              weight: 4,
              dashArray: isInactive ? "4" : undefined,
              opacity,
            }}
          />
        );
      })}

      {downPolyline.map((coords, idx) => {
        const opacity = computeOpacity(idx, downPolyline.length, isInactive);
        return (
          <Polyline
            key={`down-${idx}`}
            positions={coords}
            pathOptions={{
              color: "red",
              weight: 4,
              dashArray: isInactive ? "4" : undefined,
              opacity,
            }}
          />
        );
      })}
    </>
  );
}
