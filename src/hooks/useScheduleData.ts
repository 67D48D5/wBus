// src/hooks/useScheduleData.ts

import { useEffect, useState } from "react";

import { loadCSV } from "@/utils/getCSV";
import {
  getDepartureColumn,
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

  // CSV를 딱 한 번 로드
  useEffect(() => {
    async function loadSchedule() {
      if (!routeName) return;

      setLoading(true);
      setError(null);

      try {
        // CSV 불러오기
        const { headers, data, note, state } = await loadCSV(
          routeName,
          weekday
        );

        const column = getDepartureColumn(headers);
        setDepartureColumn(column);

        // 만약 departureColumn이 없는 CSV라면 (실제 출발 시각 정보가 없는 경우 등)
        if (!column) {
          setMinutesLeft(null);
          setFirstDeparture(null);
          return;
        }

        setHeaders(headers);
        setData(data);
        setNote(note);
        setState(state ?? "unknown");

        // "지금 시점"의 분까지 계산 (최초 1회)
        setMinutesLeft(getMinutesUntilNextDeparture(data, column));
        setFirstDeparture(getFirstDeparture(data, column));
      } catch (err) {
        console.error(err);
        setError("시간표 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [routeName, weekday]);

  // CSV 데이터가 로드된 뒤, 10초마다 "남은 시간" 재계산
  useEffect(() => {
    // 만약 컬럼이 없거나, 데이터를 아직 못 불러온 상태면 스킵
    if (!departureColumn || data.length === 0) return;

    // 10초마다 재계산 타이머
    const timer = setInterval(() => {
      setMinutesLeft(getMinutesUntilNextDeparture(data, departureColumn));
      setFirstDeparture(getFirstDeparture(data, departureColumn));
    }, 10_000);

    // 뒷정리
    return () => {
      clearInterval(timer);
    };
    // data, departureColumn이 바뀌면 새 타이머 세팅
  }, [data, departureColumn]);

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
