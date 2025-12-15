// src/features/bus/components/BusList.tsx

"use client";

import React from "react";
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
 */
export default function BusList({ routeNames }: BusListProps) {
  const { map } = useMapContext();

  // Call hooks for each possible route (max 3 routes known from routeMap.json)
  // This ensures hooks are called in the same order every render
  // Empty string is handled gracefully by the hooks (no API calls)
  const route0Data = useSortedBusList(routeNames[0] || "");
  const route1Data = useSortedBusList(routeNames[1] || "");
  const route2Data = useSortedBusList(routeNames[2] || "");

  // Collect route data
  const allRoutesData = React.useMemo(() => {
    const data = [];
    if (routeNames[0]) data.push({ routeName: routeNames[0], ...route0Data });
    if (routeNames[1]) data.push({ routeName: routeNames[1], ...route1Data });
    if (routeNames[2]) data.push({ routeName: routeNames[2], ...route2Data });
    return data;
  }, [routeNames, route0Data, route1Data, route2Data]);

  // Flatten all buses into a single list
  const allBuses = React.useMemo(() => {
    return allRoutesData.flatMap(({ routeName, sortedList, getDirection }) =>
      sortedList.map((bus) => ({ bus, routeName, getDirection }))
    );
  }, [allRoutesData]);

  // Check if any route has errors
  const anyError = allRoutesData.find((data) => data.error !== null)?.error || null;
  const errorMessage = getBusErrorMessage(anyError);
  const message = anyError ? errorMessage : "버스 데이터를 불러오는 중...";

  const isNoData = allBuses.length === 0;
  const isErrorState = isWarningError(anyError);

  return (
    <div className="fixed bottom-4 left-4 bg-white/90 rounded-lg shadow-md w-60 z-20">
      <div className="px-4 pt-3">
        <h2 className="text-sm font-bold text-gray-700 mb-2">
          🚍 전체 버스 목록 ({isNoData ? "없음" : `${allBuses.length}대 운행 중`})
        </h2>
      </div>

      <ul className="text-sm text-gray-800 h-[90px] overflow-y-auto divide-y divide-gray-200 px-4 pb-3">
        {isNoData ? (
          <li
            className={`py-2 text-xs ${isErrorState ? "text-red-500" : "text-gray-500"}`}
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
                className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                onClick={() => {
                  if (map) {
                    map.flyTo([bus.gpslati, bus.gpslong], map.getZoom(), {
                      animate: true,
                      duration: 1.5,
                    });
                  }
                }}
              >
                <div className="flex flex-col">
                  <span className="font-bold">{bus.vehicleno}</span>
                  <span className="text-[10px] text-blue-600">{routeName}번</span>
                </div>
                <span className="text-gray-500 text-[10px] text-left">
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
