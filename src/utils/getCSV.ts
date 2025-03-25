// src/utils/getCSV.ts

import Papa from "papaparse";

import type { ScheduleEntry } from "@/types/schedule";

export type ParsedCSVResult = {
  headers: string[];
  data: ScheduleEntry[];
  note: string;
  state?: "general" | "weekday" | "holiday" | "unknown";
};

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

    const parseLines = (raw: string[]): ScheduleEntry[] => {
      const csv = Papa.parse(raw.join("\n"), {
        header: true,
        skipEmptyLines: true,
      });

      return csv.data as ScheduleEntry[];
    };

    if (isGeneral) {
      const start = lines.indexOf("# General");
      const body = lines.slice(start + 1).filter((l) => !l.startsWith("##"));
      const data = parseLines(body);
      const headers = data.length > 0 ? Object.keys(data[0]) : [];

      return { headers, data, note: noteLine, state: "general" };
    } else if (isWeekday && isHoliday) {
      const startW = lines.indexOf("# Weekdays");
      const startH = lines.indexOf("# Holidays");

      const weekdayLines = lines.slice(startW + 1, startH);
      const holidayLines = lines
        .slice(startH + 1)
        .filter((l) => !l.startsWith("##"));

      const parsedWeekday = parseLines(weekdayLines);
      const parsedHoliday = parseLines(holidayLines);

      const finalData = weekday ? parsedWeekday : parsedHoliday;
      const headers = finalData.length > 0 ? Object.keys(finalData[0]) : [];

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
