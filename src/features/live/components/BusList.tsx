// src/features/live/components/BusList.tsx

"use client";

import React, { useMemo, useCallback } from "react";

import { useBusContext } from "@live/context/MapContext";
import { getDirectionIcon } from "@live/utils/directionIcons";
import { useSortedBusList } from "@live/hooks/useSortedBusList";
import { getBusErrorMessage, isWarningError } from "@live/utils/errorMessages";


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
  const { map } = useBusContext();

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
    <div className="fixed bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white/98 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl w-56 sm:w-72 z-20 border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-blue-200/50">
      <div className="px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-t-xl sm:rounded-t-2xl">
        <h2 className="text-sm sm:text-base font-bold text-white mb-1 sm:mb-2 flex items-center gap-2 tracking-tight">
          전체 버스 목록
        </h2>
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full animate-pulse ${isNoData ? 'bg-gray-300' : 'bg-green-400'}`}></div>
          <p className="text-xs sm:text-sm text-blue-50 font-medium">
            {isNoData ? "운행 중인 버스 없음" : `${allBuses.length}대 운행 중`}
          </p>
        </div>
      </div>

      <ul className="text-xs sm:text-sm text-gray-800 max-h-[100px] sm:max-h-[140px] overflow-y-auto px-2 py-1.5 sm:px-3 sm:py-2 space-y-1 sm:space-y-1.5">
        {isNoData ? (
          <li
            className={`py-3 px-2 sm:py-4 sm:px-3 text-xs sm:text-sm text-center rounded-lg ${isErrorState
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-gray-50 text-gray-500 border border-gray-200"
              }`}
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
                className="flex justify-between items-center py-2 px-2 sm:py-3 sm:px-3 cursor-pointer bg-gradient-to-r from-gray-50 to-blue-50/50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 rounded-lg sm:rounded-xl group border border-transparent hover:border-blue-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => handleBusClick(bus.gpslati, bus.gpslong)}
              >
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <span className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-700 transition-colors">
                    {bus.vehicleno}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 inline-block w-fit shadow-sm">
                    {routeName}번
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 group-hover:text-gray-900 text-[10px] sm:text-xs text-right max-w-[100px] sm:max-w-[130px] font-medium transition-colors">
                  <span className="truncate">{bus.nodenm}</span>
                  {(() => {
                    const DirectionIcon = getDirectionIcon(direction);
                    return <DirectionIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />;
                  })()}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
