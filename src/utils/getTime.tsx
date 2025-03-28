// src/utils/getTime.ts

import React, { JSX } from "react";
import type { ScheduleEntry } from "@/types/schedule";

/**
 * 현재 시각 기준으로, 지정된 출발 컬럼에서 가장 가까운 시간까지 남은 분을 계산합니다.
 */
export function getMinutesUntilNextDeparture(
  data: ScheduleEntry[],
  column: string
): number | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let nextDeparture = Infinity;

  for (const row of data) {
    const hour = parseInt(row["시간대"]);
    if (isNaN(hour)) continue;

    const cell = row[column];
    if (!cell || cell === "-" || cell.trim() === "") continue;

    const minutesArray = cell
      .split(",")
      .map((m) => parseInt(m.trim()))
      .filter((m) => !isNaN(m));

    for (const min of minutesArray) {
      const timeInMin = hour * 60 + min;
      if (timeInMin >= nowMinutes && timeInMin < nextDeparture) {
        nextDeparture = timeInMin;
      }
    }
  }

  return nextDeparture === Infinity ? null : nextDeparture - nowMinutes;
}

/**
 * 데이터에서 가장 빠른 출발 시간을 찾아 "HH시 MM분" 형식으로 반환합니다.
 */
export function getFirstDeparture(
  data: ScheduleEntry[],
  column: string
): string | null {
  let earliest = Infinity;

  for (const row of data) {
    const hour = parseInt(row["시간대"]);
    if (isNaN(hour)) continue;

    const cell = row[column];
    if (!cell || cell === "-" || cell.trim() === "") continue;

    const minutesArray = cell
      .split(",")
      .map((m) => parseInt(m.trim()))
      .filter((m) => !isNaN(m));

    for (const min of minutesArray) {
      const totalMinutes = hour * 60 + min;
      if (totalMinutes < earliest) {
        earliest = totalMinutes;
      }
    }
  }

  if (earliest === Infinity) return null;

  const hours = Math.floor(earliest / 60);
  const minutes = earliest % 60;
  return `${hours.toString().padStart(2, "0")}시 ${minutes
    .toString()
    .padStart(2, "0")}분`;
}

/**
 * 현재 출발 정보에 따라 상태 메시지를 렌더링합니다.
 *
 * @param minutesLeft 남은 분 (없으면 null)
 * @param firstDeparture 첫 출발 시각 (없으면 null)
 * @param departureColumn 출발 컬럼명 (없으면 null)
 * @returns 출발 상태 메시지를 포함한 JSX.Element
 */
export function renderScheduleStatusMessage(
  minutesLeft: number | null,
  firstDeparture: string | null,
  departureColumn: string | null
): JSX.Element {
  const headerText =
    departureColumn !== "연세대발"
      ? `${departureColumn} 버스 출발`
      : "학생회관 정류장 출발";

  let content: JSX.Element;

  if (minutesLeft !== null && minutesLeft <= 60) {
    if (minutesLeft <= 3) {
      content = (
        <div>
          대기 중인 버스가{" "}
          <span className="text-red-600 font-semibold">곧 출발</span> 해요!
          <br />
          <span className="text-xs text-gray-500">({minutesLeft}분 이내)</span>
        </div>
      );
    } else {
      content = (
        <div>
          다음 버스는 약{" "}
          <span className="text-blue-600">{minutesLeft}분 후</span> 출발합니다.
        </div>
      );
    }
  } else if (firstDeparture) {
    content = (
      <div>
        <div className="font-bold">
          현재 출발 예정인 버스가 없습니다.
          <br />
        </div>
        가장 가까운 출발 시간 |{" "}
        <span className="text-blue-700 font-semibold">{firstDeparture}</span>
      </div>
    );
  } else {
    content = <div>시간표 정보가 없습니다.</div>;
  }

  return (
    <div className="mt-2 text-sm text-gray-700 leading-normal">
      <div className="font-bold mb-1">📌 {headerText} 정보</div>
      {content}
    </div>
  );
}
