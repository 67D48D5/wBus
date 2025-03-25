// src/components/B</>usStopMarker.tsx

"use client";

import { useState } from "react";
import { Marker, Popup } from "react-leaflet";

import { useIcons } from "@/hooks/useIcons";
import { useBusStops } from "@/hooks/useBusStops";
import { useBusArrivalInfo } from "@/hooks/useBusArrivalInfo";

import BusSchedule from "./BusSchedule";

import type { ArrivalInfo } from "@/types/data";

type Props = {
  routeName: string;
};

// 교내 정류장 ID 목록
const TARGET_NODE_IDS: Array<string> = ["WJB251036041", "WJB251036043"];

/* 1) 실시간 도착정보 전용 리스트 컴포넌트 */
function ArrivalList({
  loading,
  error,
  arrivalData,
}: {
  loading: boolean;
  error: string | null;
  arrivalData: ArrivalInfo[];
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
      {arrivalData.map((bus, idx) => (
        <li key={idx} className="flex justify-between py-1 px-1">
          <span className="font-semibold">{bus.routeno}번</span>
          <span className="text-gray-600 text-[12px]">
            {/* ex: "저상 / 3분 후 (2 정류장 전)" 형태 */}
            {bus.vehicletp.slice(0, 2)} / {Math.ceil(bus.arrtime / 60)}분 후 (
            {bus.arrprevstationcnt} 정류장 전)
          </span>
        </li>
      ))}
    </ul>
  );
}

/* 2) 팝업 내용 렌더링을 전담하는 함수 */
function renderPopupContent({
  isActive,
  isTargetStop,
  isYonseiStop,
  arrivalData,
  loading,
  error,
  routeName,
}: {
  isActive: boolean;
  isTargetStop: boolean;
  isYonseiStop: boolean;
  arrivalData: ArrivalInfo[];
  loading: boolean;
  error: string | null;
  routeName: string;
}) {
  // 팝업이 닫혀 있다면 아무것도 표시하지 않음
  if (!isActive) return null;

  // "교내 정류장"인 경우
  if (isTargetStop) {
    return (
      <>
        <div className="mt-2 p-2 rounded bg-blue-50 text-blue-800 text-xs font-medium">
          🎓 연세대학교 교내 정류장입니다.
          <br />
          {isYonseiStop ? (
            /* 30·34번 노선 => 시간표 안내만 표시 */
            <>
              연세대학교가 종점인 노선은 학생회관 버스 정류장을
              기준으로 <strong>시간표 기반</strong> 출발 정보가 표시됩니다.
            </>
          ) : (
            /* 교내 정류장이지만 이 정료장이 종점인 30,34 외 => 실시간 안내 */
            <>연세대학교가 종점이 아닌 노선은 <strong>실시간 도착 정보</strong>가 표시됩니다.</>
          )}
        </div>

        {isYonseiStop ? (
          // 30·34 => BusSchedule
          <BusSchedule routeName={routeName} />
        ) : (
          // 교내 정류장이지만 30/34 외 => 실시간 도착 정보
          <ArrivalList
            loading={loading}
            error={error}
            arrivalData={arrivalData}
          />
        )}
      </>
    );
  }

  // 일반 정류장
  return (
    <ArrivalList loading={loading} error={error} arrivalData={arrivalData} />
  );
}

export default function BusStopMarker({ routeName }: Props) {
  // 1) 해당 노선의 모든 정류장 정보 불러오기
  const stops = useBusStops(routeName);

  // 2) 현재 "팝업 오픈" 상태인 정류장 ID
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  // 3) 아이콘 불러오기 (일반/연세대 전용)
  const { busStopIcon, busStopIconYonsei } = useIcons();

  // 4) 현재 선택된 정류장의 실시간 도착정보 API
  const {
    data: arrivalRawData,
    loading,
    error,
  } = useBusArrivalInfo(activeStopId);

  return (
    <>
      {stops.map((stop) => {
        // 팝업 열림 여부
        const isActive = activeStopId === stop.nodeid;

        // 교내 정류장 여부
        const isTargetStop = TARGET_NODE_IDS.includes(stop.nodeid);

        // 30·34번 노선인지 판별
        const isYonseiStop = ["30", "34"].includes(routeName);

        // 실시간 도착 정보를 "정류장 남은 수" 기준으로 정렬
        const arrivalData = [...arrivalRawData].sort(
          (a, b) => a.arrprevstationcnt - b.arrprevstationcnt
        );

        return (
          <Marker
            key={`${stop.nodeid}-${stop.updowncd}`}
            position={[stop.gpslati, stop.gpslong]}
            // 교내 정류장이면 Yonsei 아이콘, 아니면 일반 아이콘
            icon={isTargetStop ? busStopIconYonsei : busStopIcon}
            eventHandlers={{
              // 팝업 열릴 때
              popupopen: () => setActiveStopId(stop.nodeid),
              // 팝업 닫힐 때
              popupclose: () => setActiveStopId(null),
            }}
          >
            <Popup minWidth={210}>
              {/* 팝업 내부 스크롤 영역 */}
              <div className="max-h-[280px] w-[210px] overflow-y-auto">
                {/* 정류장 이름 + 노드번호 */}
                <div className="font-bold mb-1">
                  🚏 {stop.nodenm}{" "}
                  <span className="text-xs text-gray-500">{stop.nodeno}</span>
                </div>

                {/* 팝업 본문 (조건 분기 함수로 깔끔하게 렌더) */}
                {renderPopupContent({
                  isActive,
                  isTargetStop,
                  isYonseiStop,
                  arrivalData,
                  loading,
                  error,
                  routeName,
                })}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
