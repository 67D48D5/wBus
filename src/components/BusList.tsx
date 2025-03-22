// src/components/BusList.tsx

"use client";

import { useEffect, useState } from "react";
import { useMapContext } from "@/context/MapContext";
import { useBusStops } from "@/hooks/useBusStops";
import { useBusData } from "@/hooks/useBusData";
import { getRouteInfo } from "@/utils/getRouteInfo";
import type { RouteInfo } from "@/types/route";

type BusListProps = {
  routeName: string;
};

export default function BusList({ routeName }: BusListProps) {
  const { map } = useMapContext();
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    const load = async () => {
      const info = await getRouteInfo(routeName);
      setRouteInfo(info);
    };
    load();
  }, [routeName]);

  const { data: busList, error } = useBusData(routeName);
  const stops = useBusStops(routeName);

  return (
    <div className="fixed bottom-4 left-4 bg-white/90 rounded-lg shadow-md px-4 py-3 w-60 z-20">
      <h2 className="text-sm font-bold text-gray-700 mb-2">
        🚍 {routeName}번 버스 목록 (
        {busList.length > 0 ? `${busList.length}대` : "없음"})
      </h2>

      <ul className="text-sm text-gray-800 h-[120px] overflow-y-auto divide-y divide-gray-200">
        {error && (
          <li className="text-red-500 px-2 py-2 text-xs">⚠️ {error}</li>
        )}

        {busList.length === 0 && !error && (
          <li className="text-gray-400 px-2 py-2">
            현재 운행 중인 차량이 없습니다.
          </li>
        )}

        {busList.map((bus) => {
          const matchedStop = stops.find((stop) => stop.nodeid === bus.nodeid);
          const updown = matchedStop?.updowncd;

          return (
            <li
              key={`${bus.vehicleno}-${bus.gpslati}-${bus.gpslong}`}
              className="flex justify-between items-center px-2 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                if (map) {
                  map.flyTo([bus.gpslati, bus.gpslong], map.getZoom(), {
                    animate: true,
                    duration: 1.5,
                  });
                }
              }}
            >
              <span className="font-bold">{bus.vehicleno}</span>
              <span className="text-gray-500 text-xs">
                {updown === 1 ? "⬆️" : updown === 0 ? "⬇️" : "❓"} {bus.nodenm}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
