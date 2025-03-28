// src/hooks/useScheduleData.ts

import { useEffect, useState } from "react";

import { loadCSV } from "@/utils/getCSV";
import {
  getFirstDeparture,
  getMinutesUntilNextDeparture,
} from "@/utils/getTime";

import type { ScheduleEntry } from "@/types/schedule";

interface ScheduleDataHookReturn {
  data: ScheduleEntry[];
  headers: string[];
  note: string;
  minutesLeft: number | null;
  firstDeparture: string | null;
  departureColumn: string | null;
  isLoading: boolean;
  state: "general" | "weekday" | "holiday" | "unknown";
  errorMessage: string | null;
}

/**
 * 시간표 CSV를 로드하고, 일정 간격(10초)으로 현재시간 대비
 * 다음 버스까지 남은 시간(minutesLeft)과 첫 차 시각(firstDeparture)을 업데이트하는 훅
 */
export function useScheduleData(
  routeName: string,
  weekday: boolean = true
): ScheduleDataHookReturn {
  const [data, setData] = useState<ScheduleEntry[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [firstDeparture, setFirstDeparture] = useState<string | null>(null);
  const [departureColumn, setDepartureColumn] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<
    "general" | "weekday" | "holiday" | "unknown"
  >("unknown");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -------------------------
  // CSV 최초 로딩 (routeName, weekday 변경 시 재호출)
  // -------------------------
  useEffect(() => {
    // routeName 없으면 아무것도 안 함
    if (!routeName) return;

    let canceled = false;

    async function loadSchedule() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // CSV 불러오기
        const { headers, data, note, state } = await loadCSV(
          routeName,
          weekday
        );

        if (canceled) return; // cleanup 후라면 무시

        const column = headers.length > 1 ? headers[1] : null;

        // 상태 업데이트
        setDepartureColumn(column);
        setHeaders(headers);
        setData(data);
        setNote(note);
        setState(state ?? "unknown");

        // departureColumn이 없으면 minutesLeft, firstDeparture 모두 null
        if (!column) {
          setMinutesLeft(null);
          setFirstDeparture(null);
        } else {
          // 당장 "다음 버스까지 남은 분" 계산
          setMinutesLeft(getMinutesUntilNextDeparture(data, column));
          setFirstDeparture(getFirstDeparture(data, column));
        }
      } catch (err) {
        console.error(err);
        if (!canceled) {
          setErrorMessage("시간표 데이터를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    }

    loadSchedule();

    // cleanup 함수
    return () => {
      canceled = true;
    };
  }, [routeName, weekday]);

  // -------------------------
  // 10초마다 "남은 시간" 재계산
  // -------------------------
  useEffect(() => {
    // departureColumn 또는 data 없으면 타이머 설정 안 함
    if (!departureColumn || data.length === 0) return;

    const timer = setInterval(() => {
      setMinutesLeft(getMinutesUntilNextDeparture(data, departureColumn));
      setFirstDeparture(getFirstDeparture(data, departureColumn));
    }, 10_000);

    return () => clearInterval(timer);
  }, [data, departureColumn]);

  return {
    data,
    headers,
    note,
    minutesLeft,
    firstDeparture,
    departureColumn,
    isLoading,
    state,
    errorMessage,
  };
}
