// src/features/schedule/components/ScheduleView.tsx

"use client";

import { useState, useMemo, useEffect, memo } from "react";

import { DAY_TYPES, DayType } from "@core/config/env";
import { UI_TEXT, DAY_LABELS } from "@core/config/locale";

import { getCurrentDayType } from "@schedule/utils/time";

import type { BusSchedule, RowItem } from "@core/domain/schedule";

/**
 * Get the localized label for a featured stops key
 */
function getFeaturedStopsLabel(key: string): string {
    if (key === 'general') return '';
    if (key === 'weekday') return DAY_LABELS.WEEKDAY;
    if (key === 'sunday') return DAY_LABELS.SUNDAY;
    return key;
}

/**
 * Mapping from day type values to localized labels
 */
const dayTypeToLabel = {
    [DAY_TYPES.WEEKDAY]: DAY_LABELS.WEEKDAY,
    [DAY_TYPES.WEEKEND]: DAY_LABELS.WEEKEND,
} as const;

interface NextBusInfo {
    hour: string;
    minute: string;
    timeUntil: { minutes: number; seconds: number } | null;
}

function findNextBus(
    schedule: Record<string, Record<string, RowItem[]>>,
    hours: string[],
    direction: string,
    now: Date
): NextBusInfo | null {
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    for (const hour of hours) {
        const buses = schedule[hour]?.[direction];
        if (!buses?.length) continue;

        const hourNum = parseInt(hour);
        const currentHourNum = parseInt(currentHour);

        // Skip past hours
        if (hourNum < currentHourNum) continue;

        for (const bus of buses) {
            const busMinute = parseInt(bus.minute);

            // For current hour, skip past minutes
            if (hourNum === currentHourNum && busMinute < currentMinute) continue;

            // Calculate time until this bus
            const busTime = new Date(now);
            busTime.setHours(hourNum, busMinute, 0, 0);
            const diff = busTime.getTime() - now.getTime();

            if (diff < 0) continue;

            return {
                hour,
                minute: bus.minute,
                timeUntil: {
                    minutes: Math.floor(diff / 60000),
                    seconds: Math.floor((diff % 60000) / 1000),
                },
            };
        }
    }

    return null;
}

function ScheduleView({ data, mode = "full" }: { data: BusSchedule; mode?: "full" | "compact" }) {
    const isGeneralSchedule = !!data.schedule.general;
    const isCompact = mode === "compact";

    const [dayType, setDayType] = useState<DayType>(() => getCurrentDayType());
    const [direction, setDirection] = useState(data.directions[0]);
    const [now, setNow] = useState(() => new Date());

    // Single timer for all time-based updates
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Reset direction when route data changes
    useEffect(() => {
        setDirection(data.directions[0]);
    }, [data.directions]);

    const schedule = useMemo(
        () => (isGeneralSchedule ? data.schedule.general! : data.schedule[dayType]!),
        [data.schedule, dayType, isGeneralSchedule]
    );

    const hours = useMemo(
        () => Object.keys(schedule).sort(),
        [schedule]
    );

    const nextBus = useMemo(
        () => findNextBus(schedule, hours, direction, now),
        [schedule, hours, direction, now]
    );

    const highlightedHour = nextBus?.hour ?? now.getHours().toString().padStart(2, "0");

    return (
        <div className={isCompact ? "space-y-3" : "space-y-4"}>
            {!isCompact && data.routeDetails && data.routeDetails.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                    {data.routeDetails.map((detail, i) => (
                        <p key={i} className="text-amber-800">• {detail}</p>
                    ))}
                </div>
            )}

            {!isCompact && data.featuredStops && Object.keys(data.featuredStops).length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs">
                    <p className="font-bold text-slate-700 mb-2">{UI_TEXT.SCHEDULE.MAJOR_STOPS}</p>
                    {Object.entries(data.featuredStops).map(([key, stops]) => (
                        <div key={key} className="mb-2 last:mb-0">
                            <p className="text-[11px] text-slate-500 mb-1">{getFeaturedStopsLabel(key)}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {stops.map((stop, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white rounded-md text-[11px] text-slate-600 border border-slate-200">
                                        {stop}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isCompact && !isGeneralSchedule && (
                <div className="flex bg-slate-200 p-1 rounded-xl">
                    {Object.values(DAY_TYPES).map(t => (
                        <button key={t} onClick={() => setDayType(t)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${dayType === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
                            {dayTypeToLabel[t]}
                        </button>
                    ))}
                </div>
            )}

            <div className={`flex gap-2 overflow-x-auto pb-1 ${isCompact ? "text-[11px]" : "text-xs"}`}>
                {data.directions.map(dir => (
                    <button key={dir} onClick={() => setDirection(dir)}
                        className={`${isCompact ? "px-3 py-1.5" : "px-3.5 py-2"} rounded-full font-bold border whitespace-nowrap transition-all ${direction === dir ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200"}`}>
                        {dir}
                    </button>
                ))}
            </div>

            {/* Highlighted current hour - shown above the full timetable */}
            {hours.includes(highlightedHour) && (
                <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 overflow-hidden">
                    <div className="grid grid-cols-[56px_1fr]">
                        <div className="p-3 text-center border-r border-blue-200 font-mono font-bold flex flex-col items-center gap-1 text-blue-600 text-sm">
                            <div>{highlightedHour}</div>
                            {nextBus?.timeUntil && (
                                <div className="text-[11px] font-normal text-blue-500">
                                    {nextBus.timeUntil.minutes}:{nextBus.timeUntil.seconds.toString().padStart(2, '0')}
                                </div>
                            )}
                        </div>
                        <div className="p-3 flex flex-wrap gap-3 items-center">
                            {schedule[highlightedHour]?.[direction]?.map((item, i) => (
                                <span key={i} className={`text-sm font-medium ${nextBus && item.minute === nextBus.minute ? "text-blue-600 font-bold" : ""}`}>
                                    {item.minute}{item.noteId && <sup className="text-red-500 ml-0.5">{item.noteId}</sup>}
                                </span>
                            )) ?? <span className="text-slate-300"></span>}
                        </div>
                    </div>
                </div>
            )}

            {!isCompact && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {hours.map(hour => {
                        const isNow = hour === highlightedHour;
                        return (
                            <div key={hour} className={`grid grid-cols-[56px_1fr] border-b last:border-0 border-slate-200 ${isNow ? "bg-blue-100/40 border-b-2 border-blue-300" : ""}`}>
                                <div className={`p-3 text-center border-r border-slate-200 font-mono font-bold flex flex-col items-center gap-1 text-xs ${isNow ? "text-blue-600" : "text-slate-400"}`}>
                                    <div>{hour}</div>
                                    {isNow && nextBus?.timeUntil && (
                                        <div className="text-[10px] font-normal text-blue-500">
                                            {nextBus.timeUntil.minutes}:{nextBus.timeUntil.seconds.toString().padStart(2, '0')}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex flex-wrap gap-3 items-center">
                                    {schedule[hour]?.[direction]?.map((item, i) => (
                                        <span key={i} className="text-sm font-medium">
                                            {item.minute}{item.noteId && <sup className="text-red-500 ml-0.5">{item.noteId}</sup>}
                                        </span>
                                    )) ?? <span className="text-slate-300"></span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isCompact && data.notes && Object.keys(data.notes).length > 0 && (
                <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold mb-1">{UI_TEXT.SCHEDULE.NOTES_TITLE}</p>
                    {Object.entries(data.notes).map(([id, text]) => <p key={id}>{id}: {text}</p>)}
                </div>
            )}

            {!isCompact && (
                <div className="text-center text-[11px] text-slate-400">
                    {UI_TEXT.SCHEDULE.LAST_UPDATED} {data.lastUpdated}
                </div>
            )}
        </div>
    );
}

export default memo(ScheduleView);
