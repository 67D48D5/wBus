// src/components/BusSchedule.tsx

"use client";

import { getMinutesUntilNextDeparture, getFirstDeparture } from "@/utils/time";
import type { ScheduleEntry } from "@/types/schedule";

import { useEffect, useState } from "react";
import Papa from "papaparse";

type Props = {
  routeId: string;
};

export default function BusSchedule({ routeId }: Props) {
  const [data, setData] = useState<ScheduleEntry[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [weekday, setWeekday] = useState(true);
  const [hasGeneral, setHasGeneral] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const res = await fetch(`/schedules/${routeId}.csv`);
        const text = await res.text();
        const lines = text.split("\n").filter((line) => line.trim());

        const noteLine = lines
          .find((line) => line.startsWith("##"))
          ?.replace(/^##\s?/, "");
        setNote(noteLine ?? "");

        const isGeneral = lines.some((line) => line.startsWith("# General"));
        const isWeekday = lines.some((line) => line.startsWith("# Weekdays"));
        const isHoliday = lines.some((line) => line.startsWith("# Holidays"));

        setHasGeneral(isGeneral);

        const parseLines = (raw: string[]) => {
          const csv = Papa.parse(raw.join("\n"), {
            header: true,
            skipEmptyLines: true,
          });
          setHeaders(csv.meta.fields ?? []);
          return csv.data as ScheduleEntry[];
        };

        if (isGeneral) {
          const start = lines.indexOf("# General");
          const body = lines
            .slice(start + 1)
            .filter((l) => !l.startsWith("##"));
          setData(parseLines(body));
        } else if (isWeekday && isHoliday) {
          const startW = lines.indexOf("# Weekdays");
          const startH = lines.indexOf("# Holidays");

          const weekdayLines = lines.slice(startW + 1, startH);
          const holidayLines = lines
            .slice(startH + 1)
            .filter((l) => !l.startsWith("##"));

          const parsedWeekday = parseLines(weekdayLines);
          const parsedHoliday = parseLines(holidayLines);

          setData(weekday ? parsedWeekday : parsedHoliday);
        } else {
          setData([]);
          setHeaders([]);
        }
      } catch (err) {
        console.error("❌ 시간표 파싱 오류:", err);
      }
    };

    loadCSV();
  }, [routeId, weekday]);

  const departureColumn = headers.includes("연세대발")
    ? "연세대발"
    : headers.includes("회촌발")
    ? "회촌발"
    : null;

  const rawMinutesLeft = departureColumn
    ? getMinutesUntilNextDeparture(data, departureColumn)
    : null;

  // 회촌이면 7분 추가
  const minutesLeft =
    rawMinutesLeft !== null && departureColumn === "회촌발"
      ? rawMinutesLeft + 7
      : rawMinutesLeft;

  const firstDeparture = departureColumn
    ? getFirstDeparture(data, departureColumn)
    : null;

  return (
    <div
      className={`fixed bottom-[200px] left-4 w-60 z-[999] 
    max-h-[calc(100vh-3.5rem-220px)] overflow-y-auto`}
    >
      {/* 상단 바 */}
      <div
        className="bg-white/90 shadow-md ring-1 ring-gray-300 rounded-t-lg px-4 py-2 flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h2 className="font-bold text-sm text-gray-700">
          🕒 {routeId}번 시간표
        </h2>
        <div className="flex items-center space-x-2">
          {!hasGeneral && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setWeekday((w) => !w);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition"
            >
              🔄 {weekday ? "휴일" : "평일"}
            </button>
          )}
          <span
            className="text-gray-500 text-xs cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            {open ? "▼" : "▲"}
          </span>
        </div>
      </div>

      {/* 항상 렌더링되며, 상태로 스타일만 변경 */}
      <div
        className={`transition-all duration-300 text-sm bg-white/90 shadow-md ring-1 ring-t-0 ring-gray-300 rounded-b-lg
    ${
      open
        ? "max-h-[300px] p-4 opacity-100 overflow-y-auto"
        : "max-h-0 p-0 opacity-0 overflow-hidden pointer-events-none"
    }
  `}
      >
        {minutesLeft !== null && minutesLeft < 60 ? (
          <p className="mt-2 text-s text-gray-700 leading-snug">
            <span className="font-bold">
              📌{" "}
              {departureColumn === "회촌발"
                ? "학생회관 정류장 도착"
                : "학생회관 정류장 출발"}{" "}
              정보
            </span>
            <br />
            {minutesLeft === 0 ? (
              <>
                대기 중인 버스가 <span className="text-red-600">곧 출발</span>
                해요!
              </>
            ) : (
              <>
                다음 버스는{" "}
                <span className="text-blue-600">{minutesLeft}분 후</span>{" "}
                출발합니다.
              </>
            )}
          </p>
        ) : firstDeparture ? (
          <p className="mt-2 text-sm text-gray-700 font-bold leading-snug">
            🚫 지금은 학생회관 버스 정류장에서 출발 예정인 버스가 없어요. 첫차는
            <span className="text-blue-700"> {firstDeparture}</span>
            입니다.
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-500">시간표 정보가 없습니다.</p>
        )}

        <br />

        {data.length > 0 && headers.length > 0 ? (
          <table className="w-full text-xs border-t border-gray-200">
            <thead>
              <tr className="text-gray-500 border-b">
                {headers.map((header, i) => (
                  <th key={i} className="text-left py-1">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  {headers.map((h, i) => (
                    <td key={i} className="py-1 text-gray-800">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 text-xs">표시할 시간표가 없습니다.</p>
        )}

        {note && <p className="mt-3 text-xs text-gray-700 italic">※ {note}</p>}
      </div>
    </div>
  );
}
