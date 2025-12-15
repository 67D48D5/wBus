// src/features/bus/components/BusSchedule.tsx

"use client";

import { useMemo, useState } from "react";

import { useScheduleData } from "@bus/hooks/useSchedule";
import { renderScheduleStatusMessage } from "@bus/utils/getTime";

type Props = {
  routeName: string;
};

// Available bus routes for selection
const AVAILABLE_ROUTES = ["30", "34", "34-1"];

export default function BusSchedule({ routeName }: Props) {
  const [weekday, setWeekday] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState("30"); // Default to route 30

  const {
    data,
    note,
    minutesLeft,
    firstDeparture,
    isLoading,
    errorMessage,
    state,
  } = useScheduleData(selectedRoute, weekday); // Use selectedRoute instead of routeName

  const sortedHourKeys = useMemo(() => {
    return Object.keys(data).sort((a, b) => {
      const [ha, ma] = a.split(":").map(Number);
      const [hb, mb] = b.split(":").map(Number);
      return ha * 60 + ma - (hb * 60 + mb);
    });
  }, [data]);

  const directions = useMemo(() => {
    const dirSet = new Set<string>();
    sortedHourKeys.forEach((hourKey) => {
      Object.keys(data[hourKey]).forEach((dir) => dirSet.add(dir));
    });
    return Array.from(dirSet);
  }, [data, sortedHourKeys]);

  const hasSchedule = sortedHourKeys.length > 0 && directions.length > 0;
  const defaultDirection = directions[0] || "연세대";
  const showToggle = state !== "general";

  const DepartureCell = ({
    hourKey,
    dir,
  }: {
    hourKey: string;
    dir: string;
  }) => {
    const departures = data[hourKey][dir];
    if (!departures || departures.length === 0) {
      return <td className="py-1 text-gray-400">-</td>;
    }
    return (
      <td className="py-1 text-gray-800">
        {departures.map((d, idx) => (
          <span key={idx}>
            {d.time}
            {d.note && (
              <sup
                className="text-[0.6em] text-gray-500 cursor-help"
                title={note?.[d.note]}
              >
                {d.note}
              </sup>
            )}
            {idx < departures.length - 1 && <span>, </span>}
          </span>
        ))}
      </td>
    );
  };

  const NoteSection = () => {
    if (!note) return null;

    if (typeof note === "string") {
      return (
        <p className="mt-2 italic text-gray-600 text-xs leading-tight">
          ※ {note}
        </p>
      );
    }

    const entries = Object.entries(note);
    if (entries.length === 0) return null;

    return (
      <p className="mt-2 italic text-gray-600 text-xs leading-tight">
        ※ {entries.map(([k, v]) => `${k}. ${v}`).join(", ")}
      </p>
    );
  };

  if (isLoading) {
    return <p className="text-gray-500 text-sm">데이터 로딩 중...</p>;
  }
  if (errorMessage) {
    return <p className="text-red-500 text-sm">{errorMessage}</p>;
  }

  return (
    <div className="mt-2 text-xs text-gray-700">
      {renderScheduleStatusMessage(
        minutesLeft,
        firstDeparture,
        defaultDirection
      )}

      {/* Route selection dropdown */}
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor="route-select" className="text-gray-600 font-medium">
          노선:
        </label>
        <select
          id="route-select"
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
        >
          {AVAILABLE_ROUTES.map((route) => (
            <option key={route} value={route}>
              {route}번
            </option>
          ))}
        </select>
      </div>

      {showToggle && (
        <button
          onClick={() => setWeekday((prev) => !prev)}
          className="mt-2 px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium"
        >
          🔄 {weekday ? "휴일" : "평일"}
        </button>
      )}

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
            {sortedHourKeys.map((hourKey) => (
              <tr key={hourKey} className="border-b border-gray-100">
                <td className="py-1 text-gray-800">{hourKey}</td>
                {directions.map((dir) => (
                  <DepartureCell
                    key={`${hourKey}-${dir}`}
                    hourKey={hourKey}
                    dir={dir}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400 text-xs mt-1">시간표가 없습니다.</p>
      )}

      <NoteSection />
    </div>
  );
}
