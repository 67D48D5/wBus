// src/hooks/useClosestStop.ts

import { useEffect, useState } from "react";
import { useMapContext } from "@/context/MapContext";
import { useBusStops } from "./useBusStops";

/**
 * 두 좌표 사이의 거리를 Haversine 공식을 사용하여 계산합니다.
 * @param lat1 첫 번째 지점의 위도
 * @param lon1 첫 번째 지점의 경도
 * @param lat2 두 번째 지점의 위도
 * @param lon2 두 번째 지점의 경도
 * @returns 두 지점 사이의 거리 (킬로미터)
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 현재 지도 중심과 각 정류장의 거리 정보를 기반으로 가장 가까운 정류장의 순번(nodeord)을 반환합니다.
 * @param routeName 노선 이름
 * @returns 가장 가까운 정류장의 nodeord 또는 정류장이 없으면 null
 */
export function useClosestStopOrd(routeName: string): number | null {
  const { map } = useMapContext();
  const stops = useBusStops(routeName);
  const [closestOrd, setClosestOrd] = useState<number | null>(null);

  useEffect(() => {
    if (!map || stops.length === 0) return;

    const updateClosest = () => {
      const { lat, lng } = map.getCenter();
      const closestStop = stops.reduce((prev, curr) => {
        const prevDistance = getDistance(lat, lng, prev.gpslati, prev.gpslong);
        const currDistance = getDistance(lat, lng, curr.gpslati, curr.gpslong);
        return currDistance < prevDistance ? curr : prev;
      }, stops[0]);

      setClosestOrd(closestStop.nodeord);
    };

    // 최초 실행
    updateClosest();

    // 지도 이동이 완료되었을 때 업데이트
    map.on("moveend", updateClosest);

    return () => {
      map.off("moveend", updateClosest);
    };
  }, [map, stops]);

  return closestOrd;
}
