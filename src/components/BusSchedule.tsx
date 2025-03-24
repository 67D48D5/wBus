"use client";

import { useState } from "react";

import { useScheduleData } from "@/hooks/useScheduleData";
import { renderScheduleStatusMessage } from "@/utils/getTime";

type Props = {
  routeName: string;
};

export default function BusSchedule({ routeName }: Props) {
  const [weekday, setWeekday] = useState(true);
  const {
    data,
    headers,
    note,
    minutesLeft,
    firstDeparture,
    departureColumn,
    state,
  } = useScheduleData(routeName, weekday);

  const showToggle = state !== "general";

  return (
    <div className="mt-2 text-xs text-gray-700">
      {/* 상태 메시지 */}
      {renderScheduleStatusMessage(
        minutesLeft,
        firstDeparture,
        departureColumn
      )}
      
      {/* 요일 토글 */}
      {showToggle && (
        <button
          onClick={() => setWeekday((w) => !w)}
          className="mt-2 px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium"
        >
          🔄 {weekday ? "휴일" : "평일"}
        </button>
      )}

      {/* 테이블 */}
      {data.length > 0 && headers.length > 0 ? (
        <table className="mt-2 w-full border-t border-gray-200">
          <thead>
            <tr className="text-gray-500 border-b">
              {headers.map((h, i) => (
                <th key={i} className="text-left py-1">
                  {h}
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
        <p className="text-gray-400 text-xs mt-1">시간표가 없습니다.</p>
      )}

      {note && <p className="mt-2 italic text-gray-600">※ {note}</p>}
    </div>
  );
}
