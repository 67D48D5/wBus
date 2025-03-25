// src/components/BusStopMarker.tsx

"use client";

import { useState } from "react";
import { Marker, Popup } from "react-leaflet";

import { useIcons } from "@/hooks/useIcons";
import { useBusStops } from "@/hooks/useBusStops";
import { useBusDirection } from "@/hooks/useBusDirection";
import { useBusArrivalInfo } from "@/hooks/useBusArrivalInfo";

import BusSchedule from "./BusSchedule";

import type { ArrivalInfo } from "@/types/data";

type Props = {
  routeName: string;
};

/** 교내 정류장 ID 목록 */
const TARGET_NODE_IDS: Array<string> = ["WJB251036041", "WJB251036043"];

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
  /** 상행/하행 라벨 (예: "상행" / "하행" / "") */
  directionLabel: string;
}) {
  if (loading) {
    return (
      <p className="text-sm text-gray-500">버스 도착 데이터를 불러오는 중...</p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400">⚠️ {error}</p>;
  }

  if (arrivalData.length === 0) {
    return <p className="text-sm text-gray-400">예정된 버스가 없습니다.</p>;
  }

  return (
    <ul className="text-sm mt-1 divide-y divide-gray-200">
      {arrivalData.map((bus, idx) => {
        // 남은 도착 시간(분)
        const minutes = Math.ceil(bus.arrtime / 60);
        // 예: 120초 -> 2분, 30초 -> 1분, 59초 -> 1분 등

        // 시간 표현식 분기: 3분 이하이면 "곧 도착"
        let timeString = "";
        if (minutes <= 3) {
          timeString = `곧 도착 (${bus.arrprevstationcnt} 정류장 전)`;
        } else {
          timeString = `${minutes}분 (${bus.arrprevstationcnt} 정류장 전)`;
        }

        return (
          <li key={idx} className="flex justify-between py-1 px-1">
            <span className="font-semibold">{bus.routeno}번</span>
            <span className="text-gray-600 text-[11px]">
              {/* 예: "저상 / 3분 (2 정류장 전) 상행" */}
              {bus.vehicletp.slice(0, 2)} / {timeString} {directionLabel}
            </span>
          </li>
        );
      })}
    </ul>
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
  directionLabel: string; // 상행/하행 문자열
}) {
  // 팝업이 닫혀 있다면 표시 X
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
              연세대학교가 종점인 노선은 <strong>시간표에 따른</strong> 출발{""}
              정보만 제공됩니다.
            </>
          ) : (
            <>
              연세대학교가 종점이 아닌 노선은 <strong>시간표에 따른</strong>{" "}
              종점에서의 출발 정보와 <strong>실시간 도착 정보</strong>를 함께 제공합니다.
            </>
          )}
        </div>

        {/* 교내 정류장이면서 30/34 노선인 경우 => 시간표만 표시 */}
        {!isYonseiStop && (
          // 교내 정류장이지만 30/34가 아닌 노선 => 실시간 도착 정보 표시
          <ArrivalList
            loading={loading}
            error={error}
            arrivalData={arrivalData}
            directionLabel={directionLabel}
          />
        )}

        {/* 시간표 표시 */}
        <BusSchedule routeName={routeName} />
      </>
    );
  }

  // 일반 정류장
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
  // 모든 정류장 불러오기
  const stops = useBusStops(routeName);

  // 팝업 열림 상태
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  // 아이콘 (교내 vs 일반)
  const { busStopIcon, busStopIconYonsei } = useIcons();

  // 상행/하행 판별 함수
  const getDirection = useBusDirection(routeName);

  // 선택된 정류장의 실시간 도착정보
  const {
    data: arrivalRawData,
    loading,
    error,
  } = useBusArrivalInfo(activeStopId);

  return (
    <>
      {stops.map((stop) => {
        const isActive = activeStopId === stop.nodeid;
        const isTargetStop = TARGET_NODE_IDS.includes(stop.nodeid);
        const isYonseiStop = ["30", "34"].includes(routeName);

        // 도착 정보를 정류장까지 남은 수로 정렬
        const arrivalData = [...arrivalRawData].sort(
          (a, b) => a.arrprevstationcnt - b.arrprevstationcnt
        );

        const directionCode = getDirection(stop.nodeid, stop.nodeord);

        // code -> "상행"/"하행" 변환
        let directionLabel = "";

        if (directionCode === 1) directionLabel = "⬆️";
        else if (directionCode === 0) directionLabel = "⬇️";
        else directionLabel = "❓";
        // 필요 시 else 문으로 "미정" 처리할 수도 있음

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
                {/* 정류장 이름 + 번호 */}
                <div className="font-bold mb-1">
                  🚏 {stop.nodenm}{" "}
                  <span className="text-xs text-gray-500">{stop.nodeno}</span>
                </div>

                {/* 팝업 내용 렌더링 */}
                {renderPopupContent({
                  isActive,
                  isTargetStop,
                  isYonseiStop,
                  arrivalData,
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
