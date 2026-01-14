// src/features/live/components/BusStopPopup.tsx

import { useMemo } from "react";
import { AlertTriangle, Bus, Clock, MapPin } from "lucide-react";

import { ARRIVAL_MESSAGES, SCHEDULE_MESSAGES, TIME_LABELS } from "@core/config/locale";

import { useBusArrivalInfo } from "@live/hooks/useBusArrivalInfo";

import {
    formatRouteNumber,
    formatVehicleType,
    secondsToMinutes,
} from "@live/utils/formatters";

import type { ArrivalInfo } from "@core/domain/live";

// Helper to determine urgency color based on arrival time
function getUrgencyColor(minutes: number) {
    if (minutes <= 2) return "text-red-600 bg-red-50 border-red-100";
    if (minutes <= 5) return "text-orange-600 bg-orange-50 border-orange-100";
    if (minutes <= 10) return "text-blue-600 bg-blue-50 border-blue-100";
    return "text-gray-600 bg-gray-50 border-gray-100";
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
    onRouteChange,
}: {
    loading: boolean;
    error: string | null;
    arrivalData: ArrivalInfo[];
    onRouteChange?: (routeName: string) => void;
}) {
    const hasData = arrivalData.length > 0;

    // Global Popup style imposes padding: 0.
    // We must apply padding inside these wrapper divs.
    const contentPadding = "p-4";

    // Error State
    if (error) {
        return (
            <div className={`w-full min-w-[200px] ${contentPadding}`}>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full min-w-[240px] sm:min-w-[280px]">

            {/* Loading State */}
            {!hasData && loading && (
                <div className={`${contentPadding} flex flex-col items-center justify-center py-8`}>
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                    <p className="text-sm text-gray-500 font-medium">{ARRIVAL_MESSAGES.LOADING}</p>
                </div>
            )}

            {/* No Data State */}
            {!hasData && !loading && (
                <div className={contentPadding}>
                    <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                        <Bus className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-700 font-semibold">{ARRIVAL_MESSAGES.NO_BUSES}</p>
                        <p className="text-xs text-gray-500 mt-1">{ARRIVAL_MESSAGES.CHECK_SCHEDULE}</p>
                    </div>
                </div>
            )}

            {/* Data List State */}
            {hasData && (
                <div className="max-h-[260px] sm:max-h-[320px] overflow-y-auto custom-scrollbar bg-white">
                    {/* List Wrapper with Padding */}
                    <ul className="p-3 sm:p-4 space-y-2">
                        {arrivalData.map((bus, idx) => {
                            const minutes = secondsToMinutes(bus.arrtime);
                            const vehicleType = formatVehicleType(bus.vehicletp);
                            const urgencyClasses = getUrgencyColor(minutes);
                            const stopCount = formatStopCount(bus.arrprevstationcnt);
                            const rawRouteNo = bus.routeno ?? "";
                            const routeName = typeof rawRouteNo === "string"
                                ? rawRouteNo.trim()
                                : String(rawRouteNo).trim();
                            const routeLabel = routeName || String(rawRouteNo);

                            return (
                                <li key={idx}>
                                    <button
                                        type="button"
                                        className="w-full text-left bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden group"
                                        onClick={onRouteChange && routeName ? () => onRouteChange(routeName) : undefined}
                                    >
                                        <div className="flex items-stretch">
                                            {/* Left Color Bar indicating urgency */}
                                            <div className={`w-1.5 ${urgencyClasses.split(" ")[1]}`} />

                                            <div className="flex-1 p-2.5 sm:p-3 flex items-center justify-between gap-3">
                                                {/* Left: Route Info */}
                                                <div className="flex flex-col items-start gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="flex items-center justify-center min-w-[48px] h-6 px-1.5 bg-blue-600 text-white rounded text-xs font-bold shadow-sm">
                                                            {formatRouteNumber(routeLabel)}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-medium px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">
                                                            {vehicleType}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right: Time & Location */}
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs sm:text-sm font-bold ${urgencyClasses}`}>
                                                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                        <span>{minutes}{TIME_LABELS.MINUTE_SUFFIX}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 font-medium">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{stopCount}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
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
    onRouteChange,
}: {
    stopId: string;
    onRouteChange?: (routeName: string) => void;
}) {
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
            onRouteChange={onRouteChange}
        />
    );
}
