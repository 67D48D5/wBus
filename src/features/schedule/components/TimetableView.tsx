// src/features/schedule/components/TimetableView.tsx

"use client";

import { useState, useMemo, useEffect, memo } from "react";

import { DAY_TYPES, DayType } from "@core/constants/env";
import { UI_TEXT, DAY_TYPE_LABELS, FEATURED_STOPS_LABELS } from "@core/constants/locale";

import { BusData, BusTime } from "@schedule/models/bus";

/**
 * Get the localized label for a featured stops key
 */
function getFeaturedStopsLabel(key: string): string {
    if (key === 'general') return FEATURED_STOPS_LABELS.GENERAL;
    if (key === 'sunday') return FEATURED_STOPS_LABELS.SUNDAY;
    return key;
}

/**
 * Mapping from day type values to localized labels
 */
const dayTypeToLabel = {
    [DAY_TYPES.WEEKDAY]: DAY_TYPE_LABELS.WEEKDAY,
    [DAY_TYPES.WEEKEND]: DAY_TYPE_LABELS.WEEKEND,
} as const;

interface NextBusInfo {
    hour: string;
    minute: string;
    timeUntil: { minutes: number; seconds: number } | null;
}

function findNextBus(
    schedule: Record<string, Record<string, BusTime[]>>,
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

function TimetableView({ data }: { data: BusData }) {
    const isGeneralSchedule = !!data.schedule.general;

    const [dayType, setDayType] = useState<DayType>(DAY_TYPES.WEEKDAY);
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
        <div className="space-y-6">
            {data.routeDetails && data.routeDetails.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm space-y-1">
                    {data.routeDetails.map((detail, i) => (
                        <p key={i} className="text-amber-800 dark:text-amber-200">• {detail}</p>
                    ))}
                </div>
            )}

            {data.featuredStops && Object.keys(data.featuredStops).length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm">
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">{UI_TEXT.MAJOR_STOPS}</p>
                    {Object.entries(data.featuredStops).map(([key, stops]) => (
                        <div key={key} className="mb-2 last:mb-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{getFeaturedStopsLabel(key)}</p>
                            <div className="flex flex-wrap gap-2">
                                {stops.map((stop, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-slate-700 rounded-md text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                        {stop}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isGeneralSchedule && (
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                    {Object.values(DAY_TYPES).map(t => (
                        <button key={t} onClick={() => setDayType(t)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${dayType === t ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"}`}>
                            {dayTypeToLabel[t]}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2">
                {data.directions.map(dir => (
                    <button key={dir} onClick={() => setDirection(dir)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition-all ${direction === dir ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
                        {dir}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden">
                {hours.map(hour => {
                    const isNow = hour === highlightedHour;
                    return (
                        <div key={hour} className={`grid grid-cols-[70px_1fr] border-b last:border-0 dark:border-slate-700 ${isNow ? "bg-blue-100/40 dark:bg-blue-950/30 border-b-2 border-blue-400 dark:border-blue-600" : ""}`}>
                            <div className={`p-4 text-center border-r dark:border-slate-700 font-mono font-bold flex flex-col items-center gap-1 ${isNow ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                                <div>{hour}</div>
                                {isNow && nextBus?.timeUntil && (
                                    <div className="text-xs font-normal text-blue-500 dark:text-blue-400">
                                        {nextBus.timeUntil.minutes}:{nextBus.timeUntil.seconds.toString().padStart(2, '0')}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex flex-wrap gap-4 items-center">
                                {schedule[hour]?.[direction]?.map((item, i) => (
                                    <span key={i} className="text-lg font-medium">
                                        {item.minute}{item.noteId && <sup className="text-red-500 ml-0.5">{item.noteId}</sup>}
                                    </span>
                                )) ?? <span className="text-slate-300">{UI_TEXT.NO_BUSES_SYMBOL}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {data.notes && Object.keys(data.notes).length > 0 && (
                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 space-y-1">
                    <p className="font-bold mb-1">{UI_TEXT.NOTES_TITLE}</p>
                    {Object.entries(data.notes).map(([id, text]) => <p key={id}>{id}: {text}</p>)}
                </div>
            )}

            <div className="text-center text-xs text-slate-400 dark:text-slate-500">
                {UI_TEXT.LAST_UPDATED} {data.lastUpdated}
            </div>
        </div>
    );
}

export default memo(TimetableView);