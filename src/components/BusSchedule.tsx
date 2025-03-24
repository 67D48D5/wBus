// src/components/BusSchedule.tsx

"use client";

import { useState } from "react";
import { useScheduleData } from "@/hooks/useScheduleData";
import { renderScheduleStatusMessage } from "@/utils/getTime";

type BusScheduleProps = {
  routeName: string;
};

export default function BusSchedule({ routeName }: BusScheduleProps) {
  const [weekday, setWeekday] = useState(true);
  const [open, setOpen] = useState(true);

  const { data, headers, note, minutesLeft, firstDeparture, departureColumn } =
    useScheduleData(routeName, weekday);

  const hasGeneral = headers.includes("연세대발") || headers.includes("회촌발");

  return (
    <div
      className={`fixed bottom-[160px] left-4 w-60 z-10 
    max-h-[calc(100vh-3.5rem-220px)] overflow-y-auto`}
    >
      {/* 상단 바 */}
      <div
        className="bg-white/90 shadow-md ring-1 ring-gray-300 rounded-t-lg px-4 py-2 flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h2 className="font-bold text-sm text-gray-700">
          🕒 {routeName}번 시간표
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

      {/* 본문 */}
      <div
        className={`transition-all duration-300 text-sm bg-white/90 shadow-md ring-1 ring-t-0 ring-gray-300 rounded-b-lg
    ${
      open
        ? "max-h-[210px] p-4 opacity-100 overflow-y-auto"
        : "max-h-0 p-0 opacity-0 overflow-hidden pointer-events-none"
    }
  `}
      >
        {renderScheduleStatusMessage(
          minutesLeft,
          firstDeparture,
          departureColumn
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
