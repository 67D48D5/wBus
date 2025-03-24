// src/components/BusStopMarker.tsx

"use client";

import { useState } from "react";
import { Marker, Popup } from "react-leaflet";

import { useIcons } from "@/hooks/useIcons";
import { useBusStops } from "@/hooks/useBusStops";
import { useBusArrivalInfo } from "@/hooks/useBusArrivalInfo";

import BusSchedule from "./BusSchedule";

type Props = {
  routeName: string;
};

const TARGET_NODE_IDS: Array<string> = ["WJB251036041", "WJB251036043"];

export default function BusStopMarker({ routeName }: Props) {
  const stops = useBusStops(routeName);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const { data: arrivalData, loading, error } = useBusArrivalInfo(activeStopId);
  const { busStopIcon, busStopIconYonsei } = useIcons();

  return (
    <>
      {stops.map((stop) => {
        const isActive = activeStopId === stop.nodeid;
        const isTargetStop = TARGET_NODE_IDS.includes(stop.nodeid);

        return (
          <Marker
            key={`${stop.nodeid}-${stop.updowncd}`}
            position={[stop.gpslati, stop.gpslong]}
            icon={isTargetStop ? busStopIconYonsei : busStopIcon}
            eventHandlers={{
              popupopen: () => setActiveStopId(stop.nodeid),
              popupclose: () => setActiveStopId(null),
            }}
          >
            <Popup minWidth={210}>
              <div className="max-h-[280px] w-[210px] overflow-y-auto">
                <div className="font-bold mb-1">
                  🚏 {stop.nodenm}{" "}
                  <span className="text-xs text-gray-500">{stop.nodeno}</span>
                </div>

                {isActive && (
                  <>
                    {isTargetStop ? (
                      <>
                        <div className="mt-2 p-2 rounded bg-blue-50 text-blue-800 text-xs font-medium">
                          🎓 연세대학교 교내 정류장입니다.
                          <br />
                          이곳은 <strong>학생회관 버스 정류장</strong>을
                          기준으로 출발 정보가 표시됩니다.
                        </div>

                        <BusSchedule routeName={routeName} />
                      </>
                    ) : (
                      <>
                        {loading && (
                          <p className="text-sm text-gray-500">
                            버스 도착 데이터를 불러오는 중...
                          </p>
                        )}

                        {error && (
                          <p className="text-sm text-red-400">⚠️ {error}</p>
                        )}

                        {!loading && arrivalData.length === 0 && (
                          <p className="text-sm text-gray-400">
                            예정된 버스가 없습니다.
                          </p>
                        )}

                        {!loading && arrivalData.length > 0 && (
                          <ul className="text-sm mt-1 divide-y divide-gray-200">
                            {arrivalData.map((bus, idx) => (
                              <li
                                key={idx}
                                className="flex justify-between py-1 px-1"
                              >
                                <span className="font-semibold">
                                  {bus.routeno}번
                                </span>
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
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
