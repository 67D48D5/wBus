// src/features/schedule/components/NextBusTime.tsx

'use client';

import { memo, useState, useEffect } from 'react';

import { UI_TEXT } from '@core/constants/env';
import { BusData } from '@schedule/models/bus';
import { getNearestBusTime } from '@schedule/utils/time';

function NextBusTime({ data }: { data: BusData }) {
    const [nearestBus, setNearestBus] = useState<{ time: string; minutes: number } | null>(null);
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
        return <span className="text-xs text-slate-400">{UI_TEXT.LOADING}</span>;
    }

    if (!nearestBus) {
        return <span className="text-xs text-slate-400">{UI_TEXT.NO_BUSES_TODAY}</span>;
    }

    const hours = Math.floor(nearestBus.minutes / 60);
    const mins = nearestBus.minutes % 60;

    const timeText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return (
        <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {nearestBus.time}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
                in {timeText}
            </span>
        </div>
    );
}

export default memo(NextBusTime);
