// src/utils/getTime.ts

import React, { JSX } from "react";

import type { ScheduleEntry } from "@/types/schedule";

/**
 * 현재 시각 기준으로, 지정된 출발 컬럼에서 가장 가까운 시간까지 남은 분 계산
 */
export function getMinutesUntilNextDeparture(
  data: ScheduleEntry[],
  column: string
): number | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const upcomingTimes: number[] = [];

  for (const row of data) {
    const hour = parseInt(row["시간대"]);
    if (isNaN(hour)) continue;

    const cell = row[column];
    if (!cell || cell === "-" || cell.trim() === "") continue;

    const minutes = cell
      .split(",")
      .map((m: string) => parseInt(m.trim()))
      .filter((m) => !isNaN(m));

    for (const min of minutes) {
      const timeInMin = hour * 60 + min;
      if (timeInMin >= nowMinutes) {
        upcomingTimes.push(timeInMin);
      }
    }
  }

  if (upcomingTimes.length === 0) return null;

  const nextTime = upcomingTimes.sort((a, b) => a - b)[0];
  return nextTime - nowMinutes;
}

export function getFirstDeparture(
  data: ScheduleEntry[],
  column: string
): string | null {
  let earliestMinutes: number | null = null;

  for (const row of data) {
    const hour = parseInt(row["시간대"]);
    const cell = row[column];
    if (!cell || cell === "-" || cell.trim() === "") continue;

    const minutes = cell
      .split(",")
      .map((m) => parseInt(m.trim()))
      .filter((m) => !isNaN(m));

    for (const min of minutes) {
      const totalMinutes = hour * 60 + min;
      if (earliestMinutes === null || totalMinutes < earliestMinutes) {
        earliestMinutes = totalMinutes;
      }
    }
  }

  if (earliestMinutes !== null) {
    const hours = Math.floor(earliestMinutes / 60);
    const minutes = earliestMinutes % 60;
    return `${hours.toString().padStart(2, "0")}시 ${minutes
      .toString()
      .padStart(2, "0")}분`;
  }

  return null;
}

export function getDepartureColumn(headers: string[]): string | null {
  if (headers.includes("연세대발")) return "연세대발";
  if (headers.includes("회촌발")) return "회촌발";
  return null;
}

export function getCorrectedMinutesLeft(
  raw: number | null,
  column: string | null
): number | null {
  if (raw === null) return null;
  if (column === "회촌발") return raw + 7;
  return raw;
}

export function renderScheduleStatusMessage(
  minutesLeft: number | null,
  firstDeparture: string | null,
  departureColumn: string | null
): JSX.Element {
  const headerText =
    departureColumn === "회촌발"
      ? "학생회관 정류장 도착"
      : "학생회관 정류장 출발";

  return (
    <div className="mt-2 text-sm text-gray-700 leading-normal">
      {/* 헤더 부분 */}
      <div className="font-bold mb-1">📌 {headerText} 정보</div>

      {/* 상태 메시지 */}
      {minutesLeft !== null && minutesLeft <= 60 ? (
        minutesLeft <= 3 ? (
          <div>
            대기 중인 버스가{" "}
            <span className="text-red-600 font-semibold">
              곧 {departureColumn?.includes("연세대") ? "출발" : "도착"}
            </span>
            해요!
            <br />
            <span className="text-xs text-gray-500">
              ({minutesLeft}분 이내)
            </span>
          </div>
        ) : (
          <div>
            다음 버스는 약{" "}
            <span className="text-blue-600">{minutesLeft}분 후</span>{" "}
            {departureColumn?.includes("연세대") ? "출발" : "도착"}합니다.
          </div>
        )
      ) : firstDeparture ? (
        <div>
          <div className="font-bold">
            🚫 지금은 학생회관 버스 정류장에서 출발 예정인 버스가 없어요.
          </div>{" "}
          다음 출발 시간은{" "}
          <span className="text-blue-700 font-semibold">{firstDeparture}</span>
          입니다.
        </div>
      ) : (
        <div>시간표 정보가 없습니다.</div>
      )}
    </div>
  );
}
