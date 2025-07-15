// src/features/bus/components/BusStopMarker.tsx

"use client";

import { useState, useMemo } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";

import {
  BUSSTOP_TARGET_NODE_IDS,
  BUSSTOP_YONSEI_END_ROUTES,
  BUSSTOP_MARKER_MIN_ZOOM,
} from "@core/constants/env";

import { useIcons } from "@map/hooks/useIcons";

import { useBusStop } from "@bus/hooks/useBusStop";
import { useBusDirection } from "@bus/hooks/useBusDirection";
import { useBusArrivalInfo } from "@bus/hooks/useBusArrivalInfo";

import BusSchedule from "./BusSchedule";

import type { ArrivalInfo } from "@bus/types/data";

type Props = {
  routeName: string;
};

// Realtime Arrival List Component
function ArrivalList({
  loading,
  error,
  arrivalData,
  directionLabel,
}: {
  loading: boolean;
  error: string | null;
  arrivalData: ArrivalInfo[];
  directionLabel: string;
}) {
  const hasData = arrivalData.length > 0;

  if (error) {
    return <p className="text-sm text-red-400">⚠️ {error}</p>;
  }

  return (
    <div className="relative mt-1 text-sm">
      {!hasData && loading && (
        <p className="text-sm text-gray-500">
          버스 도착 데이터를 불러오는 중...
        </p>
      )}

      {!hasData && !loading && (
        <p className="text-sm text-gray-400">예정된 버스가 없습니다.</p>
      )}

      {hasData && (
        <ul className="divide-y divide-gray-200">
          {arrivalData.map((bus, idx) => {
            const minutes = Math.ceil(bus.arrtime / 60);
            const timeString =
              minutes <= 3
                ? `곧 도착 (${bus.arrprevstationcnt} 정류장 전)`
                : `${minutes}분 (${bus.arrprevstationcnt} 정류장 전)`;

            return (
              <li key={idx} className="flex justify-between py-1 px-1">
                <span className="font-semibold">{bus.routeno}번</span>
                <span className="text-gray-600 text-[11px]">
                  {bus.vehicletp.slice(0, 2)} / {timeString} {directionLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Render the popup content based on the stop type
function renderPopupContent({
  isActive,
  isTargetStop,
  isYonseiStop,
  arrivalData,
  loading,
  error,
  routeName,
  directionLabel,
}: {
  isActive: boolean;
  isTargetStop: boolean;
  isYonseiStop: boolean;
  arrivalData: ArrivalInfo[];
  loading: boolean;
  error: string | null;
  routeName: string;
  directionLabel: string;
}) {
  // If the popup is not active, return null
  if (!isActive) return null;

  // If the stop is a target stop (Yonsei University stop)
  if (isTargetStop) {
    return (
      <>
        <div className="mt-2 p-2 rounded bg-blue-50 text-blue-800 text-xs font-medium">
          🎓 연세대학교 교내 정류장입니다.
          <br />
          {isYonseiStop ? (
            <>
              연세대학교가 종점인 노선은 <strong>시간표에 따른</strong> 출발
              정보만 제공됩니다.
            </>
          ) : (
            <>
              연세대학교가 종점이 아닌 노선은 <strong>시간표에 따른</strong>{" "}
              종점에서의 출발 정보와 <strong>실시간 도착 정보</strong>를 함께
              제공합니다.
            </>
          )}
        </div>

        {!isYonseiStop && (
          <ArrivalList
            loading={loading}
            error={error}
            arrivalData={arrivalData}
            directionLabel={directionLabel}
          />
        )}

        {/* Display bus schedules */}
        <BusSchedule routeName={routeName} />
      </>
    );
  }

  // If the stop is not a target stop, show only the arrival list
  return (
    <ArrivalList
      loading={loading}
      error={error}
      arrivalData={arrivalData}
      directionLabel={directionLabel}
    />
  );
}

export default function BusStopMarker({ routeName }: Props) {
  const stops = useBusStop(routeName);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const { busStopIcon, busStopIconYonsei } = useIcons();
  const getDirection = useBusDirection(routeName);
  const {
    data: arrivalRawData,
    loading,
    error,
  } = useBusArrivalInfo(activeStopId);

  // Prepare the arrival data for rendering
  const sortedArrivalData = useMemo(() => {
    return arrivalRawData
      ? [...arrivalRawData].sort(
          (a, b) => a.arrprevstationcnt - b.arrprevstationcnt
        )
      : [];
  }, [arrivalRawData]);

  // Get the current map instance and zoom level
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  // Subscribe to zoom events to update the zoom level
  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });

  return (
    <>
      {stops.map((stop) => {
        // If the zoom level is below the threshold, do not render the marker
        if (zoom < BUSSTOP_MARKER_MIN_ZOOM) return null;

        const isActive = activeStopId === stop.nodeid;
        const isTargetStop = BUSSTOP_TARGET_NODE_IDS.includes(stop.nodeid);
        const isYonseiStop = BUSSTOP_YONSEI_END_ROUTES.includes(routeName);

        const directionCode = getDirection(stop.nodeid, stop.nodeord);
        const directionLabel =
          directionCode === 1 ? "⬆️" : directionCode === 0 ? "⬇️" : "❓";

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
            <Popup autoPan={false} minWidth={210}>
              <div className="max-h-[280px] w-[210px] overflow-y-auto">
                <div className="font-bold mb-1">
                  🚏 {stop.nodenm}{" "}
                  <span className="text-xs text-gray-500">{stop.nodeno}</span>
                </div>
                {renderPopupContent({
                  isActive,
                  isTargetStop,
                  isYonseiStop,
                  arrivalData: sortedArrivalData,
                  loading,
                  error,
                  routeName,
                  directionLabel,
                })}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
