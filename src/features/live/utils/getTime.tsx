// src/features/live/utils/getTime.ts

import React, { JSX } from "react";
import type { ReactNode } from "react";
import { SCHEDULE_MESSAGES, TIME_LABELS } from "@core/constants/locale";

/**
 * Converts a "HH:MM" formatted string to an integer representing minutes.
 */
const parseTimeStringToMinutes = (timeStr: string): number => {
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
};

/**
 * Returns the time keys of a data object sorted in ascending order by minutes.
 */
export const getSortedHourKeys = (data: Record<string, any>): string[] => {
  return Object.keys(data).sort(
    (a, b) => parseTimeStringToMinutes(a) - parseTimeStringToMinutes(b)
  );
};

/**
 * Calculates the number of minutes left until the next departure time
 * in the specified departure column (=direction) based on the current time.
 */
export function getMinutesUntilNextDeparture(
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>,
  column: string
): number | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let nextDeparture = null;

  const sortedHourKeys = getSortedHourKeys(data);

  // Use a for...of loop to exit early once the next departure is found.
  for (const hourKey of sortedHourKeys) {
    if (!data[hourKey] || !data[hourKey][column]) {
      continue;
    }
    const departures = data[hourKey][column];
    const hour = parseInt(hourKey.split(":")[0], 10);

    // Use a for...of loop here as well for early exit.
    for (const dep of departures) {
      const minute = parseInt(dep.time, 10);
      const totalMin = hour * 60 + minute;
      if (totalMin >= nowMinutes) {
        nextDeparture = totalMin;
        break; // Found the next departure, exit the inner loop.
      }
    }
    if (nextDeparture !== null) {
      break; // Found the next departure, exit the outer loop.
    }
  }

  return nextDeparture !== null ? nextDeparture - nowMinutes : null;
}

/**
 * Finds the earliest departure time in the data and returns it as a "HH시 MM분" formatted string.
 */
export function getFirstDeparture(
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>,
  column: string
): string | null {
  const sortedHourKeys = getSortedHourKeys(data);

  for (const hourKey of sortedHourKeys) {
    if (!data[hourKey] || !data[hourKey][column]) continue;
    const departures = data[hourKey][column];

    // The first departure in the first hour key will be the earliest.
    if (departures.length > 0) {
      const firstDep = departures[0];
      const hour = parseInt(hourKey.split(":")[0], 10);
      const minute = parseInt(firstDep.time, 10);
      const totalMin = hour * 60 + minute;
      const hours = Math.floor(totalMin / 60);
      const minutes = totalMin % 60;
      return `${hours.toString().padStart(2, "0")}${TIME_LABELS.HOUR_SUFFIX} ${minutes
        .toString()
        .padStart(2, "0")}${TIME_LABELS.MINUTE_SUFFIX}`;
    }
  }

  return null;
}
