// src/components/BusSchedule.tsx

"use client";

import { JSX, useState } from "react";

import { useScheduleData } from "@/hooks/useScheduleData";
import { renderScheduleStatusMessage } from "@/utils/getTime";

type Props = {
  routeName: string;
};

export default function BusSchedule({ routeName }: Props) {
  // 평일(true)/공휴일(false) 구분
  const [weekday, setWeekday] = useState(true);

  // useScheduleData 훅 사용
  // 여기서는 direction을 별도 지정하지 않으면 기본값("연세대")이 사용됨
  const {
    data, // 전체 시간표
    note, // 비고
    minutesLeft,
    firstDeparture,
    isLoading,
    errorMessage,
    state, // "general" | "weekday" | "holiday" | "unknown"
  } = useScheduleData(routeName, weekday);

  // 로딩/에러 처리
  if (isLoading) {
    return <p className="text-gray-500 text-sm">데이터 로딩 중...</p>;
  }

  if (errorMessage) {
    return <p className="text-red-500 text-sm">{errorMessage}</p>;
  }

  // "general"이면 토글이 필요 없다고 가정
  const showToggle = state !== "general";

  // 시간대(key) 목록
  const hourKeys = Object.keys(data).sort((a, b) => {
    const [ha, ma] = a.split(":").map(Number);
    const [hb, mb] = b.split(":").map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });

  // 방향(컬럼) 목록
  const directionSet = new Set<string>();
  hourKeys.forEach((hourKey) => {
    Object.keys(data[hourKey]).forEach((dir) => directionSet.add(dir));
  });
  const directions = Array.from(directionSet); // ["연세대", "장양리", ...]

  // 실제로 시간표에 표시할 항목이 있는지
  const hasSchedule = hourKeys.length > 0 && directions.length > 0;

  // 메시지용 기본 방향(표시용)
  // useScheduleData 훅 내부에서는 기본으로 "연세대" 정보를 minutesLeft로 계산한다.
  // 여기서는 테이블이나 메시지 표시는 "첫 번째 방향 or '연세대'" 로 보정
  const defaultDirection = directions[0] || "연세대";

  return (
    <div className="mt-2 text-xs text-gray-700">
      {/* 출발 상태 메시지 렌더링 */}
      {renderScheduleStatusMessage(
        minutesLeft,
        firstDeparture,
        defaultDirection
      )}

      {/* 요일 토글 버튼 */}
      {showToggle && (
        <button
          onClick={() => setWeekday((prev) => !prev)}
          className="mt-2 px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium"
        >
          🔄 {weekday ? "휴일" : "평일"}
        </button>
      )}

      {/* 시간표 테이블 */}
      {hasSchedule ? (
        <table className="mt-2 w-full border-t border-gray-200">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="text-left py-1 w-16">시간대</th>
              {directions.map((dir) => (
                <th key={dir} className="text-left py-1">
                  {dir}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourKeys.map((hourKey) => (
              <tr key={hourKey} className="border-b border-gray-100">
                <td className="py-1 text-gray-800">{hourKey}</td>
                {directions.map((dir) => {
                  const departures = data[hourKey][dir];
                  if (!departures) {
                    return (
                      <td
                        key={`${hourKey}-${dir}`}
                        className="py-1 text-gray-400"
                      >
                        -
                      </td>
                    );
                  }
                  // 같은 시간대라도 여러 출발 시각이 있을 수 있으니 합쳐서 표시
                  return (
                    <td
                      key={`${hourKey}-${dir}`}
                      className="py-1 text-gray-800"
                    >
                      {departures && departures.length > 0 ? (
                        departures.map((d, idx) => (
                          <span key={idx}>
                            {d.time}
                            {d.note && (
                              <sup
                                className="text-[0.6em] align-top text-gray-500 cursor-help"
                                title={note[d.note]}
                              >
                                {d.note}
                              </sup>
                            )}
                            {idx < departures.length - 1 && <span>, </span>}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400 text-xs mt-1">시간표가 없습니다.</p>
      )}

      {/* 비고 정보 표시 (ex: "1": "상지대 경유" 등) */}
      {note &&
        (typeof note === "string" ? (
          <p className="mt-2 italic text-gray-600 text-xs leading-tight">
            ※ {note}
          </p>
        ) : Object.keys(note).length > 0 ? (
          <p className="mt-2 italic text-gray-600 text-xs leading-tight">
            ※{" "}
            {Object.entries(note)
              .map(([noteKey, noteVal]) => `${noteKey}. ${noteVal}`)
              .join(", ")}
          </p>
        ) : null)}
    </div>
  );
}
