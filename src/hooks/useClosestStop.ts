// src/hooks/useClosestStop.ts

import { useEffect, useState } from "react";
import { useMapContext } from "@/context/MapContext";
import { useBusStops } from "./useBusStops";

import type { BusStop } from "@/types/route";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useClosestStopOrd(routeName: string): number | null {
  const { map } = useMapContext();
  const stops = useBusStops(routeName);
  const [closestOrd, setClosestOrd] = useState<number | null>(null);

  useEffect(() => {
    if (!map || stops.length === 0) return;

    const updateClosest = () => {
      const center = map.getCenter();
      const lat = center.lat;
      const lng = center.lng;

      const closest = stops.reduce((min, stop) => {
        const d1 = getDistance(lat, lng, stop.gpslati, stop.gpslong);
        const d2 = getDistance(lat, lng, min.gpslati, min.gpslong);
        return d1 < d2 ? stop : min;
      }, stops[0]);

      setClosestOrd(closest.nodeord);
    };

    // 최초 1회 실행
    updateClosest();

    // 지도 이동이 끝났을 때 실행
    map.on("moveend", updateClosest);

    return () => {
      map.off("moveend", updateClosest);
    };
  }, [map, stops]);

  return closestOrd;
}
