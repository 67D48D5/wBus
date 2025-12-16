// src/features/bus/components/BusList.tsx

"use client";

import React, { useMemo, useCallback } from "react";
import { useMapContext } from "@map/context/MapContext";
import { useSortedBusList } from "@bus/hooks/useSortedBusList";
import { getBusErrorMessage, isWarningError } from "@shared/utils/errorMessages";
import { getDirectionIcon } from "@shared/utils/directionIcons";

type BusListProps = {
  routeNames: string[];
};

/**
 * Displays a list of buses for all routes with real-time location updates.
 * Users can click on a bus to center the map on its location.
 * 
 * Note: Hooks must be called unconditionally to follow Rules of Hooks.
 * We call hooks for up to 3 routes (known maximum from routeMap.json).
 * Empty route names are handled gracefully by useSortedBusList.
 * 
 * **Limitation**: This component supports a maximum of 3 routes. If more routes
 * are needed in the future, consider refactoring to use a different pattern
 * such as extracting route data collection into a separate component per route.
 */
export default function BusList({ routeNames }: BusListProps) {
  const { map } = useMapContext();

  // Call hooks unconditionally for known maximum number of routes (3)
  // Empty strings are handled gracefully - no API calls are made
  const route0Data = useSortedBusList(routeNames[0] || "");
  const route1Data = useSortedBusList(routeNames[1] || "");
  const route2Data = useSortedBusList(routeNames[2] || "");

  // Collect all active route data with proper memoization
  const allRoutesData = useMemo(() => {
    const data = [];
    if (routeNames[0]) data.push({ routeName: routeNames[0], ...route0Data });
    if (routeNames[1]) data.push({ routeName: routeNames[1], ...route1Data });
    if (routeNames[2]) data.push({ routeName: routeNames[2], ...route2Data });
    return data;
  }, [routeNames, route0Data, route1Data, route2Data]);

  // Flatten all buses into a single list with proper memoization
  const allBuses = useMemo(() => {
    return allRoutesData.flatMap(({ routeName, sortedList, getDirection }) =>
      sortedList.map((bus) => ({ bus, routeName, getDirection }))
    );
  }, [allRoutesData]);

  // Check if any route has errors with proper memoization
  const anyError = useMemo(() => {
    return allRoutesData.find((data) => data.error !== null)?.error || null;
  }, [allRoutesData]);

  const errorMessage = getBusErrorMessage(anyError);
  const message = anyError ? errorMessage : "버스 데이터를 불러오는 중...";

  const isNoData = allBuses.length === 0;
  const isErrorState = isWarningError(anyError);

  // Stable callback for bus click handler
  const handleBusClick = useCallback((lat: number, lng: number) => {
    if (map) {
      map.flyTo([lat, lng], map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [map]);

  return (
    <div className="fixed bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl w-64 z-20 border border-gray-200">
      <div className="px-4 pt-4 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
        <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
          🚍 전체 버스 목록
        </h2>
        <p className="text-xs text-gray-600">
          {isNoData ? "운행 중인 버스 없음" : `${allBuses.length}대 운행 중`}
        </p>
      </div>

      <ul className="text-sm text-gray-800 max-h-[120px] overflow-y-auto divide-y divide-gray-100 px-2 pb-2">
        {isNoData ? (
          <li
            className={`py-3 px-2 text-xs text-center ${isErrorState ? "text-red-500" : "text-gray-500"}`}
          >
            {message}
          </li>
        ) : (
          allBuses.map(({ bus, routeName, getDirection }) => {
            const direction = bus.nodeid && bus.nodeord !== undefined
              ? getDirection(bus.nodeid, bus.nodeord)
              : null;

            return (
              <li
                key={`${routeName}-${bus.vehicleno}`}
                className="flex justify-between items-center py-2.5 px-2 cursor-pointer hover:bg-blue-50 transition-all duration-200 rounded-lg group"
                onClick={() => handleBusClick(bus.gpslati, bus.gpslong)}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{bus.vehicleno}</span>
                  <span className="text-[10px] font-semibold text-white bg-blue-600 rounded px-1.5 py-0.5 inline-block w-fit">{routeName}번</span>
                </div>
                <span className="text-gray-600 text-[11px] text-right max-w-[120px] truncate">
                  {bus.nodenm} {getDirectionIcon(direction)}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
