// src/components/BusStopMarker.tsx

"use client";

import { useState } from "react";
import { Marker, Popup } from "react-leaflet";

import { useBusStops } from "@/hooks/useBusStops";
import { useBusArrivalInfo } from "@/hooks/useBusArrivalInfo";
import { busStopIcon } from "@/constants/icons";

type Props = {
  routeName: string;
};

export default function BusStopMarker({ routeName }: Props) {
  const stops = useBusStops(routeName);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  // 하나의 훅만 호출! 에러 해결
  const { data, loading, error } = useBusArrivalInfo(activeStopId);

  return (
    <>
      {stops.map((stop) => (
        <Marker
          key={`${stop.nodeid}-${stop.updowncd}`}
          position={[stop.gpslati, stop.gpslong]}
          icon={busStopIcon}
          eventHandlers={{
            popupopen: () => setActiveStopId(stop.nodeid),
            popupclose: () => setActiveStopId(null),
          }}
        >
          <Popup minWidth={200}>
            <div>
              <div className="font-bold mb-1">
                🚏 {stop.nodenm}{" "}
                <span className="text-xs text-gray-500">{stop.nodeno}</span>
              </div>

              {activeStopId === stop.nodeid && (
                <>
                  {loading && (
                    <p className="text-sm text-gray-500">
                      버스 도착 데이터를 불러오는 중...
                    </p>
                  )}

                  {error && <p className="text-sm text-red-500">⚠️ {error}</p>}
                  {!loading && data.length === 0 && (
                    <p className="text-sm text-gray-400">
                      예정된 버스가 없습니다.
                    </p>
                  )}

                  {!loading && data.length > 0 && (
                    <ul className="text-sm space-y-1 mt-1">
                      {data.map((bus, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span className="font-semibold">{bus.routeno}번</span>
                          <span className="text-gray-600">
                            {Math.ceil(bus.arrtime / 60)}분 후 (
                            {bus.arrprevstationcnt} 정류장 전)
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
