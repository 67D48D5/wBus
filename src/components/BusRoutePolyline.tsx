// src/components/BusRoutePolyline.tsx

"use client";

import { Polyline } from "react-leaflet";
import { useBusStops } from "@/hooks/useBusStops";
import { useMemo } from "react";

type Props = {
  routeId: string;
};

export default function BusRoutePolyline({ routeId }: Props) {
  const stops = useBusStops(routeId);

  const { upStops, downStops } = useMemo(() => {
    // 먼저 nodeord 기준 정렬
    const sorted = [...stops].sort((a, b) => a.nodeord - b.nodeord);

    const up: [number, number][] = [];
    const down: [number, number][] = [];

    sorted.forEach((stop) => {
      const point: [number, number] = [stop.gpslati, stop.gpslong];
      if (stop.updowncd === 0) {
        up.push(point);
      } else if (stop.updowncd === 1) {
        down.push(point);
      }
    });

    return { upStops: up, downStops: down };
  }, [stops]);

  return (
    <>
      <Polyline
        positions={upStops}
        pathOptions={{ color: "blue", weight: 4 }}
      />
      <Polyline
        positions={downStops}
        pathOptions={{ color: "red", weight: 4 }}
      />
    </>
  );
}
