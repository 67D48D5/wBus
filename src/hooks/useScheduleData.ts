// src/hooks/useScheduleData.ts

import { useEffect, useState } from "react";
import { loadCSV } from "@/utils/getCSV";
import {
  getDepartureColumn,
  getCorrectedMinutesLeft,
  getFirstDeparture,
  getMinutesUntilNextDeparture,
} from "@/utils/getTime";

import type { ScheduleEntry } from "@/types/schedule";

export function useScheduleData(routeName: string, weekday: boolean = true) {
  const [data, setData] = useState<ScheduleEntry[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [firstDeparture, setFirstDeparture] = useState<string | null>(null);
  const [departureColumn, setDepartureColumn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<
    "general" | "weekday" | "holiday" | "unknown"
  >("unknown");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const fetch = async () => {
      if (!routeName) return;

      setLoading(true);
      setError(null);

      try {
        const { headers, data, note, state } = await loadCSV(
          routeName,
          weekday
        );
        const column = getDepartureColumn(headers);
        setDepartureColumn(column);

        if (!column) {
          setMinutesLeft(null);
          setFirstDeparture(null);
          return;
        }

        setHeaders(headers);
        setData(data);
        setNote(note);
        setState(state ?? "unknown");
        setDepartureColumn(column);

        const raw = getMinutesUntilNextDeparture(data, column);
        setMinutesLeft(getCorrectedMinutesLeft(raw, column));
        setFirstDeparture(getFirstDeparture(data, column));
      } catch (err) {
        console.error(err);
        setError("시간표 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetch();

    timer = setInterval(fetch, 10000);

    return () => clearInterval(timer);
  }, [routeName, weekday]);

  return {
    data,
    headers,
    note,
    minutesLeft,
    firstDeparture,
    departureColumn,
    loading,
    state,
    error,
  };
}
