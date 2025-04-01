// src/components/BusStopMarker.tsx

"use client";

import { useState, useMemo } from "react";
import { Marker, Popup } from "react-leaflet";

import { useIcons } from "@map/hooks/useIcons";
import { useBusStop } from "@bus/hooks/useBusStop";
import { useBusDirection } from "@bus/hooks/useBusDirection";
import { useBusArrivalInfo } from "@bus/hooks/useBusArrivalInfo";

import BusSchedule from "./BusSchedule";

import type { ArrivalInfo } from "@bus/types/data";

type Props = {
  routeName: string;
};

/** 교내 정류장 ID 목록 */
const TARGET_NODE_IDS: string[] = process.env.NEXT_PUBLIC_TARGET_NODE_IDS
  ? process.env.NEXT_PUBLIC_TARGET_NODE_IDS.split(",")
  : [];

if (TARGET_NODE_IDS.length === 0) {
  throw new Error("TARGET_NODE_IDS 환경 변수가 설정되지 않았습니다.");
}

/** 교내 종점 버스 노선 목록 */
const YONSEI_END_ROUTES: string[] = process.env.NEXT_PUBLIC_YONSEI_END_ROUTES
  ? process.env.NEXT_PUBLIC_YONSEI_END_ROUTES.split(",")
  : [];

if (YONSEI_END_ROUTES.length === 0) {
  throw new Error("YONSEI_END_ROUTES 환경 변수가 설정되지 않았습니다.");
}

/* 실시간 도착정보 리스트 */
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
          ⏳ 버스 도착 데이터를 불러오는 중...
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

/* 팝업 내용 렌더링 */
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
  // 팝업이 닫혀 있다면 아무것도 렌더링하지 않음
  if (!isActive) return null;

  // 교내 정류장인 경우
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

        {/* 교내 정류장이면서 30/34 노선이 아닌 경우에만 실시간 도착 정보 표시 */}
        {!isYonseiStop && (
          <ArrivalList
            loading={loading}
            error={error}
            arrivalData={arrivalData}
            directionLabel={directionLabel}
          />
        )}

        {/* 시간표 정보 표시 */}
        <BusSchedule routeName={routeName} />
      </>
    );
  }

  // 일반 정류장의 경우 실시간 도착 정보만 표시
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
  // 모든 정류장 데이터를 불러옴
  const stops = useBusStop(routeName);
  // 팝업 열림 상태를 추적하는 상태
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  // 아이콘 정보
  const { busStopIcon, busStopIconYonsei } = useIcons();
  // 상행/하행 판별 함수
  const getDirection = useBusDirection(routeName);
  // 선택된 정류장에 대한 실시간 도착정보
  const {
    data: arrivalRawData,
    loading,
    error,
  } = useBusArrivalInfo(activeStopId);

  // arrivalRawData를 정렬한 결과를 메모이제이션하여 불필요한 재계산을 방지합니다.
  const sortedArrivalData = useMemo(() => {
    return arrivalRawData
      ? [...arrivalRawData].sort(
          (a, b) => a.arrprevstationcnt - b.arrprevstationcnt
        )
      : [];
  }, [arrivalRawData]);

  return (
    <>
      {stops.map((stop) => {
        const isActive = activeStopId === stop.nodeid;
        const isTargetStop = TARGET_NODE_IDS.includes(stop.nodeid);
        const isYonseiStop = YONSEI_END_ROUTES.includes(routeName);

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
                {/* 정류장 이름 및 번호 */}
                <div className="font-bold mb-1">
                  🚏 {stop.nodenm}{" "}
                  <span className="text-xs text-gray-500">{stop.nodeno}</span>
                </div>
                {/* 팝업 내용 렌더링 */}
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
