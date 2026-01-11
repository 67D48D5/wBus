// src/features/schedule/components/NextBusTime.tsx

'use client';

import { memo, useState, useEffect } from 'react';
import { Navigation } from 'lucide-react';

import { UI_TEXT, COMMON, TIME_LABELS } from '@core/config/locale';

import { BusData } from '@core/domain/schedule';
import { getNearestBusTime } from '@schedule/utils/time';

function NextBusTime({ data }: { data: BusData }) {
    const [nearestBus, setNearestBus] = useState<{ time: string; minutes: number; destination: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const updateTime = () => {
            setNearestBus(getNearestBusTime(data));
        };

        updateTime();

        // Update every minute
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, [data]);

    // Avoid hydration mismatch by not rendering time-sensitive content on server
    if (!mounted) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-xs text-slate-400">{COMMON.LOADING}</span>
            </div>
        );
    }

    if (!nearestBus) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-xs text-slate-400">{UI_TEXT.NO_BUSES_SYMBOL}</span>
            </div>
        );
    }

    const hours = Math.floor(nearestBus.minutes / 60);
    const mins = nearestBus.minutes % 60;

    const timeText = hours > 0
        ? `${hours}${TIME_LABELS.HOUR_ABBREV} ${mins}${TIME_LABELS.MINUTE_ABBREV}`
        : `${mins}${TIME_LABELS.MINUTE_ABBREV}`;

    // Determine urgency color based on time remaining
    const isUrgent = nearestBus.minutes <= 10;
    const isSoon = nearestBus.minutes <= 30;

    return (
        <div className="flex flex-col items-end gap-0.5">
            {/* Destination badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                <Navigation className="w-2.5 h-2.5 text-blue-500 dark:text-blue-400" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[60px]">
                    {nearestBus.destination}
                </span>
            </div>
            {/* Time and remaining */}
            <div className="flex items-baseline gap-1.5">
                <span className={`text-sm font-bold ${isUrgent
                    ? 'text-red-500 dark:text-red-400'
                    : isSoon
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                    {nearestBus.time}
                </span>
                <span className={`text-[10px] font-medium ${isUrgent
                    ? 'text-red-400 dark:text-red-500'
                    : isSoon
                        ? 'text-amber-400 dark:text-amber-500'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                    {timeText}
                </span>
            </div>
        </div>
    );
}

export default memo(NextBusTime);
