// src/components/BusStopMarker.tsx

"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";

import { useBusStops } from "@/hooks/useBusStops";
import { useBusArrivalInfo } from "@/hooks/useBusArrivalInfo";
import { useScheduleData } from "@/hooks/useScheduleData";
import { loadCSV } from "@/utils/getCSV";
import {
  getMinutesUntilNextDeparture,
  getFirstDeparture,
  getCorrectedMinutesLeft,
  renderScheduleStatusMessage,
  getDepartureColumn,
} from "@/utils/getTime";
import { busStopIcon, busStopIconYonsei } from "@/constants/icons";

import type { ScheduleEntry } from "@/types/schedule";

type Props = {
  routeName: string;
};

const TARGET_NODE_ID = "WJB251036041";

export default function BusStopMarker({ routeName }: Props) {
  const stops = useBusStops(routeName);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const { data: arrivalData, loading, error } = useBusArrivalInfo(activeStopId);

  const {
    data: schedule,
    minutesLeft,
    firstDeparture,
    departureColumn,
  } = useScheduleData(routeName, true);

  return (
    <>
      {stops.map((stop) => {
        const isActive = activeStopId === stop.nodeid;
        const isTargetStop = stop.nodeid === TARGET_NODE_ID;

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
            <Popup minWidth={200}>
              <div>
                <div className="font-bold mb-1">
                  🚏 {stop.nodenm}{" "}
                  <span className="text-xs text-gray-500">{stop.nodeno}</span>
                </div>

                {isActive && (
                  <>
                    {isTargetStop ? (
                      <>
                        <div className="mt-2 p-2 rounded bg-blue-50 text-blue-800 text-xs font-medium">
                          🎓 연세대학교 학생회관 정류장입니다.
                          <br />
                          이곳은 <strong>출발 기준 정류장</strong>으로, 시간표
                          출발시간을 기준으로 정보가 표시됩니다. (현재 선택된
                          노선: {routeName}번) [평일 기준]
                        </div>

                        {schedule.length > 0 &&
                          departureColumn &&
                          renderScheduleStatusMessage(
                            minutesLeft,
                            firstDeparture,
                            departureColumn
                          )}
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
