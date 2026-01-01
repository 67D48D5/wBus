// src/features/live/components/BusStopPopup.tsx

import { useMemo } from "react";
import { AlertTriangle, Bus, Clock, MapPin } from "lucide-react";

import { ARRIVAL_MESSAGES, SCHEDULE_MESSAGES, TIME_LABELS } from "@core/constants/locale";

import {
    formatRouteNumber,
    formatVehicleType,
    secondsToMinutes,
} from "@live/utils/formatters";
import { useBusArrivalInfo } from "@live/hooks/useBusArrivalInfo";

import type { ArrivalInfo } from "@live/models/data";


type Props = {
    stopId: string;
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
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {!hasData && loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full shadow-lg"></div>
                        <p className="text-sm text-gray-600 font-medium">{ARRIVAL_MESSAGES.LOADING}</p>
                    </div>
                </div>
            )}

            {!hasData && !loading && (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <Bus className="w-12 h-12 text-blue-500 mb-3 animate-bounce" />
                    <p className="text-sm text-gray-600 font-semibold">{ARRIVAL_MESSAGES.NO_BUSES}</p>
                    <p className="text-xs text-gray-500 mt-1">{ARRIVAL_MESSAGES.CHECK_SCHEDULE}</p>
                </div>
            )}

            {hasData && (
                <div className="max-h-[320px] overflow-y-auto">
                    <ul className="space-y-2">
                        {arrivalData.map((bus, idx) => {
                            const minutes = secondsToMinutes(bus.arrtime);
                            const vehicleType = formatVehicleType(bus.vehicletp);
                            const urgencyColor = getUrgencyColor(minutes);
                            const stopCount = formatStopCount(bus.arrprevstationcnt);

                            return (
                                <li
                                    key={idx}
                                    className="groups relative bg-gradient-to-r from-white to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {/* Urgency indicator bar */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${urgencyColor.split(' ')[1]} shadow-sm`}></div>

                                    <div className="flex items-center justify-between p-3 pl-4 gap-3">
                                        {/* Route number */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className="flex items-center justify-center min-w-[55px] h-9 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
                                                {formatRouteNumber(bus.routeno)}
                                            </div>

                                            {/* Vehicle type badge */}
                                            <span className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-md text-[10px] font-semibold shadow-sm">
                                                {vehicleType}
                                            </span>
                                        </div>

                                        {/* Arrival info */}
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${urgencyColor} font-bold text-sm whitespace-nowrap shadow-sm`}>
                                                <Clock className="w-4 h-4" />
                                                <span>{minutes}{TIME_LABELS.MINUTE_SUFFIX}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-gray-600 font-medium whitespace-nowrap bg-white px-2 py-0.5 rounded-md shadow-sm">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span>{stopCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
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
        <ArrivalList
            loading={loading}
            error={error}
            arrivalData={sortedArrivalData}
        />
    );
}