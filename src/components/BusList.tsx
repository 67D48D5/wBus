// src/components/BusList.tsx

"use client";

import { useMapContext } from "@/context/MapContext";
import { useBusStops } from "@/hooks/useBusStops";
import { useBusData } from "@/hooks/useBusData";
import { getRepresentativeRouteId } from "@/utils/getRepresentativeRouteId";

type BusItem = {
  gpslati: number;
  gpslong: number;
  vehicleno: string;
  nodenm: string;
  nodeid: string;
};

type BusListProps = {
  routeId: string;
};

export default function BusList({ routeId }: BusListProps) {
  const { map } = useMapContext();
  const { data: busList, error } = useBusData(routeId);
  const repRouteId = getRepresentativeRouteId(routeId);
  const stops = useBusStops(repRouteId ?? "");

  return (
    <div className="fixed bottom-4 left-4 bg-white/90 rounded-lg shadow-md px-4 py-3 w-60 z-[998]">
      <h2 className="text-sm font-bold text-gray-700 mb-2">
        🚍 {routeId}번 버스 목록 (
        {busList.length > 0 ? `${busList.length}대` : "없음"})
      </h2>
      <ul className="text-sm text-gray-800 h-[120px] overflow-y-auto divide-y divide-gray-200">
        {busList.length === 0 && (
          <li className="text-gray-400 px-2 py-2">
            현재 운행 중인 차량이 없습니다.
          </li>
        )}

        {busList.map((bus, idx) => {
          const matchedStop = stops.find(
            (stop) => stop.nodeid.trim() === bus.nodeid.trim()
          );
          const updown = matchedStop?.updowncd;

          if (!matchedStop) {
            console.warn("⚠️ 정류장 매칭 실패:", bus.nodeid);
          }

          return (
            <li
              key={idx}
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
