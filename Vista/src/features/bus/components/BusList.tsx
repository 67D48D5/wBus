// src/features/bus/components/BusList.tsx

"use client";

import { useMemo } from "react";

import { useMapContext } from "@map/context/MapContext";
import { useBusStop } from "@bus/hooks/useBusStop";
import { useBusLocationData } from "@bus/hooks/useBusLocation";
import { useBusDirection } from "@bus/hooks/useBusDirection";
import { useClosestStopOrd } from "@bus/hooks/useBusStop";

type BusListProps = {
  routeName: string;
};

export default function BusList({ routeName }: BusListProps) {
  const { map } = useMapContext();

  // @TODO: Remove hardcoded strings
  const errorMessageMap: Record<string, string> = {
    "ERR:NONE_RUNNING": "운행이 종료되었습니다.",
    "ERR:NETWORK": "⚠️ 네트워크 오류가 발생했습니다.",
    "ERR:INVALID_ROUTE": "⚠️ 유효하지 않은 노선입니다.",
  };

  // Get bus location data for the specified route
  const { data: busList, error } = useBusLocationData(routeName);
  const getDirection = useBusDirection(routeName);
  const stops = useBusStop(routeName);
  const closestOrd = useClosestStopOrd(routeName);

  // Sort bus list based on proximity to the closest stop
  // If no closest stop is found, return the original bus list
  const stopMap = useMemo(
    () => new Map(stops.map((s) => [s.nodeid, s.nodeord])),
    [stops]
  );

  const sortedBusList = useMemo(() => {
    if (!closestOrd) return busList;
    return [...busList].sort((a, b) => {
      const ordA = stopMap.get(a.nodeid) ?? Infinity;
      const ordB = stopMap.get(b.nodeid) ?? Infinity;
      return Math.abs(ordA - closestOrd) - Math.abs(ordB - closestOrd);
    });
  }, [busList, stopMap, closestOrd]);

  // If no bus data is available, show a loading message or error
  const message = error
    ? errorMessageMap[error] ?? "⚠️ 알 수 없는 오류가 발생했습니다."
    : "버스 데이터를 불러오는 중...";

  return (
    <div className="fixed bottom-4 left-4 bg-white/90 rounded-lg shadow-md w-60 z-20">
      <div className="px-4 pt-3">
        <h2 className="text-sm font-bold text-gray-700 mb-2">
          🚍 {routeName}번 버스 목록 (
          {busList.length > 0 ? `${busList.length}대 운행 중` : "없음"})
        </h2>
      </div>

      {/* When no data recevied */}
      <ul className="text-sm text-gray-800 h-[90px] overflow-y-auto divide-y divide-gray-200 px-4 pb-3">
        {busList.length === 0 && (
          <li
            className={`py-2 text-xs ${
              error && error !== "ERR:NONE_RUNNING"
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {message}
          </li>
        )}

        {/* Render sorted bus list */}
        {sortedBusList.map((bus) => {
          const direction = getDirection(bus.nodeid, bus.nodeord);
          return (
            <li
              key={`${bus.vehicleno}-${bus.gpslati}-${bus.gpslong}`}
              className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-100"
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
              <span className="text-gray-500 text-[10px] text-left">
                {bus.nodenm}{" "}
                {direction === 1 ? "⬆️" : direction === 0 ? "⬇️" : "❓"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
