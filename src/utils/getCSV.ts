// src/utils/getCSV.ts

import Papa from "papaparse";
import type { ScheduleEntry } from "@/types/schedule";

export type ParsedCSVResult = {
  headers: string[];
  data: ScheduleEntry[];
  note: string;
  state?: "general" | "weekday" | "holiday" | "unknown";
};

function parseCSV(rawLines: string[]): {
  headers: string[];
  data: ScheduleEntry[];
} {
  const csv = Papa.parse(rawLines.join("\n"), {
    header: true,
    skipEmptyLines: true,
  });
  const data = csv.data as ScheduleEntry[];
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  return { headers, data };
}

export async function loadCSV(
  routeName: string,
  weekday: boolean
): Promise<ParsedCSVResult> {
  try {
    const res = await fetch(`/schedules/${routeName}.csv`);
    const text = await res.text();
    const lines = text.split("\n").filter((line) => line.trim());

    const noteLine =
      lines.find((line) => line.startsWith("##"))?.replace(/^##\s?/, "") ?? "";

    const isGeneral = lines.some((line) => line.startsWith("# General"));
    const isWeekday = lines.some((line) => line.startsWith("# Weekdays"));
    const isHoliday = lines.some((line) => line.startsWith("# Holidays"));

    if (isGeneral) {
      const startIndex = lines.indexOf("# General");
      const sectionLines = lines
        .slice(startIndex + 1)
        .filter((l) => !l.startsWith("##"));
      const { headers, data } = parseCSV(sectionLines);
      return { headers, data, note: noteLine, state: "general" };
    } else if (isWeekday && isHoliday) {
      const startWeekdays = lines.indexOf("# Weekdays");
      const startHolidays = lines.indexOf("# Holidays");

      const weekdaySection = lines.slice(startWeekdays + 1, startHolidays);
      const holidaySection = lines
        .slice(startHolidays + 1)
        .filter((l) => !l.startsWith("##"));

      const { data: weekdayData, headers: weekdayHeaders } =
        parseCSV(weekdaySection);
      const { data: holidayData, headers: holidayHeaders } =
        parseCSV(holidaySection);

      const finalData = weekday ? weekdayData : holidayData;
      // headers 선택 시 두 섹션의 헤더가 다를 경우를 고려할 수 있음
      const headers =
        finalData.length > 0 ? (weekday ? weekdayHeaders : holidayHeaders) : [];

      return {
        headers,
        data: finalData,
        note: noteLine,
        state: weekday ? "weekday" : "holiday",
      };
    } else {
      return { headers: [], data: [], note: noteLine, state: "unknown" };
    }
  } catch (err) {
    console.error("❌ 시간표 파싱 오류:", err);
    return { headers: [], data: [], note: "" };
  }
}
