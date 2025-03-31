// src/components/BusList.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useMapContext } from "@/context/MapContext";
import { useBusStops } from "@/hooks/useBusStops";
import { useBusData } from "@/hooks/useBusData";
import { getRouteInfo } from "@/utils/getRouteMap";
import { useBusDirection } from "@/hooks/useBusDirection";
import { useClosestStopOrd } from "@/hooks/useClosestStop";

import type { RouteInfo } from "@/types/data";

type BusListProps = {
  routeName: string;
};

export default function BusList({ routeName }: BusListProps) {
  const { map } = useMapContext();
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // 비동기적으로 routeInfo를 불러와 상태에 저장합니다.
  useEffect(() => {
    const loadRouteInfo = async () => {
      const info = await getRouteInfo(routeName);
      setRouteInfo(info);
    };
    loadRouteInfo();
  }, [routeName]);

  // 버스 데이터와 관련 훅들을 불러옵니다.
  const { data: busList, error } = useBusData(routeName);
  const getDirection = useBusDirection(routeName);
  const stops = useBusStops(routeName);
  const closestOrd = useClosestStopOrd(routeName);

  // 가장 가까운 정류장 순번을 기준으로 버스 목록을 정렬합니다.
  const sortedBusList = useMemo(() => {
    if (!closestOrd) return busList;
    const stopMap = new Map(stops.map((s) => [s.nodeid, s.nodeord]));
    return [...busList].sort((a, b) => {
      const ordA = stopMap.get(a.nodeid) ?? Infinity;
      const ordB = stopMap.get(b.nodeid) ?? Infinity;
      return Math.abs(ordA - closestOrd) - Math.abs(ordB - closestOrd);
    });
  }, [busList, stops, closestOrd]);

  return (
    <div className="fixed bottom-4 left-4 bg-white/90 rounded-lg shadow-md w-60 z-20">
      <div className="px-4 pt-3">
        <h2 className="text-sm font-bold text-gray-700 mb-2">
          🚍 {routeName}번 버스 목록 (
          {busList.length > 0 ? `${busList.length}대 운행 중` : "없음"})
        </h2>
      </div>

      {/* 버스 데이터가 없거나 에러 발생 시 메시지 렌더링 */}
      <ul className="text-sm text-gray-800 h-[90px] overflow-y-auto divide-y divide-gray-200 px-4 pb-3">
        {busList.length === 0 && (
          <li
            className={`py-2 text-xs ${
              error && error !== "ERR:NONE_RUNNING"
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {error === "ERR:NONE_RUNNING"
              ? "운행이 종료되었습니다."
              : error === "ERR:NETWORK"
              ? "⚠️ 네트워크 오류가 발생했습니다."
              : error === "ERR:INVALID_ROUTE"
              ? "⚠️ 유효하지 않은 노선입니다."
              : !error
              ? "버스 데이터를 불러오는 중..."
              : "⚠️ 알 수 없는 오류가 발생했습니다."}
          </li>
        )}

        {/* 정렬된 버스 목록 렌더링 */}
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
