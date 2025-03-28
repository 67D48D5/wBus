// src/components/BusSchedule.tsx

"use client";

import { useState } from "react";

import { useScheduleData } from "@/hooks/useScheduleData";
import { renderScheduleStatusMessage } from "@/utils/getTime";

type Props = {
  routeName: string;
};

export default function BusSchedule({ routeName }: Props) {
  // 요일 상태: true => 평일, false => 휴일
  const [weekday, setWeekday] = useState(true);

  // useScheduleData 훅을 통해 스케줄 데이터와 관련 정보를 가져옴
  const {
    data,
    headers,
    note,
    minutesLeft,
    firstDeparture,
    departureColumn,
    state,
  } = useScheduleData(routeName, weekday);

  // "general"이 아닐 때만 요일 토글 버튼을 표시
  const showToggle = state !== "general";

  return (
    <div className="mt-2 text-xs text-gray-700">
      {/* 출발 상태 메시지 렌더링 */}
      {renderScheduleStatusMessage(
        minutesLeft,
        firstDeparture,
        departureColumn
      )}

      {/* 요일 토글 버튼 (평일/휴일) */}
      {showToggle && (
        <button
          onClick={() => setWeekday((prev) => !prev)}
          className="mt-2 px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium"
        >
          🔄 {weekday ? "휴일" : "평일"}
        </button>
      )}

      {/* 시간표 테이블 렌더링 */}
      {data.length > 0 && headers.length > 0 ? (
        <table className="mt-2 w-full border-t border-gray-200">
          <thead>
            <tr className="text-gray-500 border-b">
              {headers.map((header, idx) => (
                <th key={idx} className="text-left py-1">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100">
                {headers.map((header, cellIndex) => (
                  <td key={cellIndex} className="py-1 text-gray-800">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400 text-xs mt-1">시간표가 없습니다.</p>
      )}

      {/* 시간표 관련 노트가 있을 경우 표시 */}
      {note && <p className="mt-2 italic text-gray-600">※ {note}</p>}
    </div>
  );
}
