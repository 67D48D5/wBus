// src/utils/getTime.ts

import React, { JSX } from "react";

/**
 * 현재 시각 기준, 지정된 출발 컬럼(=direction)에서
 * 가장 가까운 출발 시간까지 남은 분을 계산합니다.
 *
 * @param data { "06:00": {"연세대": [{time: "05"}], "장양리": [...]}, ... }
 * @param column "연세대" | "장양리" 등
 * @returns 남은 분(정수), 없다면 null
 */
export function getMinutesUntilNextDeparture(
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>,
  column: string
): number | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let nextDeparture = Infinity;

  // 시간 정렬 (안전하게 커스텀 정렬 사용)
  const hourKeys = Object.keys(data).sort((a, b) => {
    const [ha, ma] = a.split(":").map(Number);
    const [hb, mb] = b.split(":").map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });

  for (const hourKey of hourKeys) {
    if (!data[hourKey][column]) continue;
    // 해당 시간대에 column(방향) 출발 정보가 있다면 각각 검사
    const departures = data[hourKey][column];

    // hourKey에서 시 추출
    const [hourStr] = hourKey.split(":");
    const hour = parseInt(hourStr, 10);
    if (isNaN(hour)) continue;

    for (const dep of departures) {
      const minute = parseInt(dep.time, 10);
      if (isNaN(minute)) continue;

      const totalMin = hour * 60 + minute;
      if (totalMin >= nowMinutes && totalMin < nextDeparture) {
        nextDeparture = totalMin;
      }
    }
  }

  return nextDeparture === Infinity ? null : nextDeparture - nowMinutes;
}

/**
 * 데이터에서 가장 빠른 출발 시간을 찾아 "HH시 MM분" 형식으로 반환.
 */
export function getFirstDeparture(
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>,
  column: string
): string | null {
  let earliest = Infinity;

  // 안전하게 커스텀 정렬
  const hourKeys = Object.keys(data).sort((a, b) => {
    const [ha, ma] = a.split(":").map(Number);
    const [hb, mb] = b.split(":").map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });

  for (const hourKey of hourKeys) {
    if (!data[hourKey][column]) continue;
    const departures = data[hourKey][column];

    const [hourStr] = hourKey.split(":");
    const hour = parseInt(hourStr, 10);
    if (isNaN(hour)) continue;

    for (const dep of departures) {
      const minute = parseInt(dep.time, 10);
      if (isNaN(minute)) continue;

      const totalMin = hour * 60 + minute;
      if (totalMin < earliest) {
        earliest = totalMin;
      }
    }
  }

  if (earliest === Infinity) {
    return null;
  }

  const hours = Math.floor(earliest / 60);
  const minutes = earliest % 60;
  return `${hours.toString().padStart(2, "0")}시 ${minutes
    .toString()
    .padStart(2, "0")}분`;
}

/**
 * 현재 출발 정보에 따라 상태 메시지를 렌더링합니다.
 * @param minutesLeft 남은 분
 * @param firstDeparture 첫 출발 시각
 * @param departureColumn 어떤 방향의 정보인지 (ex. "연세대", "장양리")
 */
export function renderScheduleStatusMessage(
  minutesLeft: number | null,
  firstDeparture: string | null,
  departureColumn: string | null
): JSX.Element {
  const headerText =
    departureColumn === "연세대"
      ? "학생회관 정류장 출발" // 예시: 연세대가 학생회관이라 가정
      : `${departureColumn} 버스 출발`;

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
          <span className="text-blue-600 font-semibold">
            {minutesLeft}분 후
          </span>{" "}
          출발합니다.
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
