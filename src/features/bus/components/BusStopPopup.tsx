// src/features/bus/components/BusStopPopup.tsx

import { useMemo } from "react";

import {
    BUSSTOP_TARGET_NODE_IDS,
    BUSSTOP_YONSEI_END_ROUTES,
} from "@core/constants/env";

import {
    formatArrivalTime,
    formatRouteNumber,
    formatVehicleType,
    secondsToMinutes,
} from "@shared/utils/formatters";

import BusSchedule from "./BusSchedule";

import { useBusArrivalInfo } from "@bus/hooks/useBusArrivalInfo";
import type { ArrivalInfo } from "@bus/types/data";

type Props = {
    routeName: string;
    stopId: string;
    directionLabel: string;
};

// Real-time arrival list component
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
                        const minutes = secondsToMinutes(bus.arrtime);
                        const timeString = formatArrivalTime(minutes, bus.arrprevstationcnt);
                        const vehicleType = formatVehicleType(bus.vehicletp);

                        return (
                            <li key={idx} className="flex justify-between py-1 px-1">
                                <span className="font-semibold">{formatRouteNumber(bus.routeno)}</span>
                                <span className="text-gray-600 text-[11px]">
                                    {vehicleType} / {timeString} {directionLabel}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function BusStopPopup({
    routeName,
    stopId,
    directionLabel,
}: Props) {
    const {
        data: arrivalRawData,
        loading,
        error,
    } = useBusArrivalInfo(stopId);

    const isTargetStop = BUSSTOP_TARGET_NODE_IDS.includes(stopId);
    const isYonseiStop = BUSSTOP_YONSEI_END_ROUTES.includes(routeName);

    const sortedArrivalData = useMemo(() => {
        return arrivalRawData
            ? [...arrivalRawData].sort(
                (a, b) => a.arrprevstationcnt - b.arrprevstationcnt
            )
            : [];
    }, [arrivalRawData]);

    // 연세대학교 정류장일 경우의 팝업 내용
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
                        arrivalData={sortedArrivalData}
                        directionLabel={directionLabel}
                    />
                )}

                {/* 버스 시간표 컴포넌트 */}
                <BusSchedule routeName={routeName} />
            </>
        );
    }

    // 일반 정류장일 경우의 팝업 내용
    return (
        <ArrivalList
            loading={loading}
            error={error}
            arrivalData={sortedArrivalData}
            directionLabel={directionLabel}
        />
    );
}