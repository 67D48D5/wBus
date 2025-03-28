// src/hooks/useScheduleData.ts

"use client";

import { useEffect, useState } from "react";
import { loadSchedule } from "@/utils/getSchedule"; // 실제 구현 필요
import {
  getFirstDeparture,
  getMinutesUntilNextDeparture,
} from "@/utils/getTime";

// getSchedule.ts에서 가져올 때, 이런 형태로 리턴한다고 가정
export interface ParsedScheduleResult {
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>;
  note: Record<string, string>;
  state: "general" | "weekday" | "holiday" | "unknown";
}

interface ScheduleDataHookReturn {
  /** 시간표 전체 데이터(JSON) */
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>;
  /** 노트 정보 */
  note: Record<string, string>;
  /** 다음 버스까지 남은 분 (특정 방향 기준) */
  minutesLeft: number | null;
  /** 첫 차 시각 (특정 방향 기준) */
  firstDeparture: string | null;
  /** 현재 로딩 중인지 */
  isLoading: boolean;
  /** 일반 / 평일 / 공휴일 / 미확인 */
  state: "general" | "weekday" | "holiday" | "unknown";
  /** 로딩/파싱 중 오류 메시지 */
  errorMessage: string | null;
}

/**
 * JSON 시간표를 로드하고, 일정 간격(10초)으로
 * '특정 방향'의 다음 버스 정보를 갱신해 주는 훅.
 *
 * @param routeName 노선명 (URL 등으로부터)
 * @param weekday true=평일, false=공휴일
 * @param direction "연세대" 등, minutesLeft/firstDeparture 계산용
 */
export function useScheduleData(
  routeName: string,
  weekday: boolean = true,
  direction: string = "연세대" // 기본값
): ScheduleDataHookReturn {
  const [data, setData] = useState<
    Record<string, Record<string, Array<{ time: string; note?: string }>>>
  >({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [firstDeparture, setFirstDeparture] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<
    "general" | "weekday" | "holiday" | "unknown"
  >("unknown");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --------------------------------
  // JSON 최초 로드
  // --------------------------------
  useEffect(() => {
    if (!routeName) return;

    let canceled = false;
    setIsLoading(true);
    setErrorMessage(null);

    (async () => {
      try {
        // JSON 노선 데이터를 불러오기
        const { data, note, state } = await loadSchedule(routeName, weekday);
        if (canceled) return;

        setData(data);
        setNote(note);
        setState(state ?? "unknown");

        // 'direction' 기준 남은 시간 계산
        if (Object.keys(data).length > 0 && direction) {
          setMinutesLeft(getMinutesUntilNextDeparture(data, direction));
          setFirstDeparture(getFirstDeparture(data, direction));
        } else {
          setMinutesLeft(null);
          setFirstDeparture(null);
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
    })();

    // cleanup
    return () => {
      canceled = true;
    };
  }, [routeName, weekday, direction]);

  // --------------------------------
  // 10초마다 '남은 시간' 갱신
  // --------------------------------
  useEffect(() => {
    // data가 없거나, direction이 없으면 타이머 불필요
    if (!direction || Object.keys(data).length === 0) {
      setMinutesLeft(null);
      setFirstDeparture(null);
      return;
    }

    // 최초 1회 업데이트
    setMinutesLeft(getMinutesUntilNextDeparture(data, direction));
    setFirstDeparture(getFirstDeparture(data, direction));

    const timer = setInterval(() => {
      setMinutesLeft(getMinutesUntilNextDeparture(data, direction));
      setFirstDeparture(getFirstDeparture(data, direction));
    }, 10_000);

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
