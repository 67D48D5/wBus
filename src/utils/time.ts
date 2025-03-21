// src/utils/time.ts

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
      .map((m: string) => parseInt(m.trim())) // 🔧 여기에 타입 추가!
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
