// src/features/bus/components/BusList.tsx

"use client";

import { useMapContext } from "@map/context/MapContext";

import { useSortedBusList } from "@bus/hooks/useSortedBusList";

type BusListProps = {
  routeName: string;
};

const ERROR_MESSAGE_MAP: Record<string, string> = {
  "ERR:NONE_RUNNING": "운행이 종료되었습니다.",
  "ERR:NETWORK": "⚠️ 네트워크 오류가 발생했습니다.",
  "ERR:INVALID_ROUTE": "⚠️ 유효하지 않은 노선입니다.",
};

export default function BusList({ routeName }: BusListProps) {
  const { map } = useMapContext();
  const { sortedList: busList, getDirection, error } = useSortedBusList(routeName);

  const message = error
    ? ERROR_MESSAGE_MAP[error] ?? "⚠️ 알 수 없는 오류가 발생했습니다."
    : "버스 데이터를 불러오는 중...";

  // Separate the two rendering states to improve clarity
  const isNoData = busList.length === 0;

  return (
    <div className="fixed bottom-4 left-4 bg-white/90 rounded-lg shadow-md w-60 z-20">
      <div className="px-4 pt-3">
        <h2 className="text-sm font-bold text-gray-700 mb-2">
          🚍 {routeName}번 버스 목록 ({isNoData ? "없음" : `${busList.length}대 운행 중`})
        </h2>
      </div>

      <ul className="text-sm text-gray-800 h-[90px] overflow-y-auto divide-y divide-gray-200 px-4 pb-3">
        {isNoData ? (
          <li
            className={`py-2 text-xs ${error && error !== "ERR:NONE_RUNNING" ? "text-red-500" : "text-gray-500"}`}
          >
            {message}
          </li>
        ) : (
          busList.map((bus) => {
            const direction = bus.nodeid && bus.nodeord !== undefined
              ? getDirection(bus.nodeid, bus.nodeord)
              : null; // Check for valid data before calling getDirection

            return (
              <li
                key={bus.vehicleno}
                className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
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
          })
        )}
      </ul>
    </div>
  );
}
