// src/features/live/components/BusStopPopup.tsx

import { useMemo } from "react";

import {
    formatRouteNumber,
    formatVehicleType,
    secondsToMinutes,
} from "@live/utils/formatters";
import { ARRIVAL_MESSAGES, SCHEDULE_MESSAGES, TIME_LABELS } from "@core/constants/locale";
import type { ArrivalInfo } from "@live/models/data";
import { useBusArrivalInfo } from "@live/hooks/useBusArrivalInfo";

type Props = {
    routeName: string;
    stopId: string;
    directionLabel: string;
};

// Helper to determine urgency color based on arrival time
function getUrgencyColor(minutes: number) {
    if (minutes <= 2) return "text-red-500 bg-red-50";
    if (minutes <= 5) return "text-orange-500 bg-orange-50";
    if (minutes <= 10) return "text-blue-500 bg-blue-50";
    return "text-gray-600 bg-gray-50";
}

// Helper to format remaining stops
function formatStopCount(count: number) {
    if (count === 0) return SCHEDULE_MESSAGES.ARRIVING_SOON;
    if (count === 1) return SCHEDULE_MESSAGES.ONE_STOP_AWAY;
    return SCHEDULE_MESSAGES.STOPS_AWAY(count);
}

// Real-time arrival list component
function ArrivalList({
    loading,
    error,
    arrivalData,
}: {
    loading: boolean;
    error: string | null;
    arrivalData: ArrivalInfo[];
}) {
    const hasData = arrivalData.length > 0;

    if (error) {
        return (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {!hasData && loading && (
                <div className="flex items-center justify-center py-6">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                        <p className="text-xs text-gray-500">{ARRIVAL_MESSAGES.LOADING}</p>
                    </div>
                </div>
            )}

            {!hasData && !loading && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <span className="text-3xl mb-2">🚌</span>
                    <p className="text-sm text-gray-500 font-medium">{ARRIVAL_MESSAGES.NO_BUSES}</p>
                    <p className="text-xs text-gray-400 mt-1">{ARRIVAL_MESSAGES.CHECK_SCHEDULE}</p>
                </div>
            )}

            {hasData && (
                <ul className="space-y-1.5">
                    {arrivalData.map((bus, idx) => {
                        const minutes = secondsToMinutes(bus.arrtime);
                        const vehicleType = formatVehicleType(bus.vehicletp);
                        const urgencyColor = getUrgencyColor(minutes);
                        const stopCount = formatStopCount(bus.arrprevstationcnt);

                        return (
                            <li
                                key={idx}
                                className="group relative bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                            >
                                {/* Urgency indicator bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${urgencyColor.split(' ')[1]}`}></div>

                                <div className="flex items-center justify-between p-2 pl-3 gap-2">
                                    {/* Route number */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="flex items-center justify-center min-w-[50px] h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md font-bold text-sm shadow-sm">
                                            {formatRouteNumber(bus.routeno)}
                                        </div>

                                        {/* Vehicle type badge */}
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                                            {vehicleType}
                                        </span>
                                    </div>

                                    {/* Arrival info */}
                                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${urgencyColor} font-bold text-sm whitespace-nowrap`}>
                                            <span>🕐</span>
                                            <span>{minutes}{TIME_LABELS.MINUTE_SUFFIX}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 text-[10px] text-gray-500 whitespace-nowrap">
                                            <span>📍</span>
                                            <span>{stopCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function BusStopPopup({
    stopId,
}: Props) {
    const {
        data: arrivalRawData,
        loading,
        error,
    } = useBusArrivalInfo(stopId);

    const sortedArrivalData = useMemo(() => {
        return arrivalRawData
            ? [...arrivalRawData].sort(
                (a, b) => a.arrprevstationcnt - b.arrprevstationcnt
            )
            : [];
    }, [arrivalRawData]);

    return (
        <div className="w-full max-w-[360px]">
            {/* Arrival list */}
            <ArrivalList
                loading={loading}
                error={error}
                arrivalData={sortedArrivalData}
            />
        </div>
    );
}