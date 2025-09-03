// src/features/bus/hooks/useSchedule.ts

"use client";

import { useEffect, useMemo, useState } from "react";

import { API_REFRESH_INTERVAL } from "@core/constants/env";

import { loadSchedule } from "@bus/api/getSchedule";
import {
  getFirstDeparture,
  getMinutesUntilNextDeparture,
  getSortedHourKeys,
} from "@bus/utils/getTime";

export type TimeTableData = Record<
  string, // hour
  Record<
    string, // direction
    Array<{ time: string; note?: string }>
  >
>;

export type NoteMap = Record<string, string>;
export type ScheduleState = "general" | "weekday" | "holiday" | "unknown";

export interface ScheduleDataHookReturn {
  data: TimeTableData;
  note: NoteMap;
  minutesLeft: number | null;
  firstDeparture: string | null;
  isLoading: boolean;
  state: ScheduleState;
  errorMessage: string | null;
}

export function useScheduleData(
  routeName: string,
  weekday: boolean = true
): ScheduleDataHookReturn {
  const [data, setData] = useState<TimeTableData>({});
  const [note, setNote] = useState<NoteMap>({});
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [firstDeparture, setFirstDeparture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<ScheduleState>("unknown");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const direction = useMemo(() => getDefaultDirectionFromData(data), [data]);

  // Load data once the routeName or weekday changes
  useEffect(() => {
    if (!routeName) return;
    let canceled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await loadSchedule(routeName, weekday);
        if (canceled) return;

        setData(result.data);
        setNote(result.note);
        setState(result.state ?? "unknown");

        if (Object.keys(result.data).length > 0 && direction) {
          setMinutesLeft(getMinutesUntilNextDeparture(result.data, direction));
          setFirstDeparture(getFirstDeparture(result.data, direction));
        } else {
          setMinutesLeft(null);
          setFirstDeparture(null);
        }
      } catch (err) {
        console.error(err);
        if (!canceled) {
          setErrorMessage("Error loading schedule data.");
          setData({});
          setNote({});
          setState("unknown");
          setMinutesLeft(null);
          setFirstDeparture(null);
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      canceled = true;
    };
  }, [routeName, weekday]);

  // Refresh interval
  useEffect(() => {
    if (!direction || Object.keys(data).length === 0) {
      setMinutesLeft(null);
      setFirstDeparture(null);
      return;
    }

    const update = () => {
      setMinutesLeft(getMinutesUntilNextDeparture(data, direction));
      setFirstDeparture(getFirstDeparture(data, direction));
    };

    update();
    const timer = setInterval(update, API_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [data, direction]);

  return {
    data,
    note,
    minutesLeft,
    firstDeparture,
    isLoading,
    state,
    errorMessage,
  };
}

// Utility function to get the default direction from the timetable data
function getDefaultDirectionFromData(data: TimeTableData): string | null {
  const hourKeys = getSortedHourKeys(data);
  for (const hour of hourKeys) {
    const directions = Object.keys(data[hour]);
    if (directions.length > 0) {
      return directions[0];
    }
  }
  return null;
}
