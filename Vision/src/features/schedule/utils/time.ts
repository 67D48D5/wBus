// src/features/schedule/utils/time.ts

import type { BusSchedule } from '@core/domain/schedule';

/**
 * Get current hour as zero-padded string (e.g., "09", "14")
 */
export function getCurrentHour(): string {
    return String(new Date().getHours()).padStart(2, '0');
}

/**
 * Get current day type based on day of week
 */
export function getCurrentDayType(): 'weekday' | 'weekend' {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

/**
 * Format time string for display
 */
export function formatTime(hour: string, minute: string): string {
    return `${hour}:${minute.padStart(2, '0')}`;
}

/**
 * Get current minutes since midnight
 */
export function getCurrentMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

/**
 * Convert time string (HH or HH:mm) to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
    const colonIndex = timeStr.indexOf(':');
    if (colonIndex === -1) {
        return parseInt(timeStr, 10) * 60;
    }
    return parseInt(timeStr.substring(0, colonIndex), 10) * 60 +
        parseInt(timeStr.substring(colonIndex + 1), 10);
}

/**
 * Find the nearest upcoming bus time for a given route
 */
export function getNearestBusTime(busData: BusSchedule): { time: string; minutes: number; destination: string } | null {
    // Check for general schedule first, then fall back to day-specific schedule
    const schedule = busData.schedule.general || busData.schedule[getCurrentDayType()];

    if (!schedule) return null;

    const currentMinutes = getCurrentMinutes();
    const MINUTES_PER_DAY = 1440; // 24 * 60
    let minDifference = Infinity;
    let nearestTime: { time: string; minutes: number; destination: string } | null = null;

    // Iterate through all hours and minutes to find the next bus
    for (const [hour, hourlySchedule] of Object.entries(schedule)) {
        const hourNum = parseInt(hour, 10);
        const hourMinutes = hourNum * 60;

        for (const [destination, busTimes] of Object.entries(hourlySchedule)) {
            for (const { minute } of busTimes) {
                const busMinutes = hourMinutes + parseInt(minute, 10);

                // Calculate difference (prefer future times, wrap to next day if needed)
                const difference = busMinutes >= currentMinutes
                    ? busMinutes - currentMinutes
                    : MINUTES_PER_DAY + busMinutes - currentMinutes;

                if (difference < minDifference) {
                    minDifference = difference;
                    nearestTime = { time: `${hour}:${minute}`, minutes: difference, destination };
                }
            }
        }
    }

    return nearestTime;
}

