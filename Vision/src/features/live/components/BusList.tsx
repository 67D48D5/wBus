// src/features/live/components/BusList.tsx

"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { useBusContext } from "@live/context/MapContext";
import { useSortedBusList } from "@live/hooks/useSortedBusList";

import { getDirectionIcon } from "@live/utils/directionIcons";
import { getBusErrorMessage, isWarningError } from "@live/utils/errorMessages";

import { UI_TEXT, SCHEDULE_MESSAGES } from "@core/config/locale";
import { APP_CONFIG, MAP_SETTINGS } from "@core/config/env";

type BusListProps = {
  routeNames: string[];
  allRoutes: string[];
  selectedRoute: string;
  onRouteChange: (route: string) => void;
};

type RouteData = ReturnType<typeof useSortedBusList>;

/**
 * Component to fetch data for a single route and pass it up to the parent.
 * This allows fetching data for a dynamic number of routes.
 */
const RouteDataCollector = React.memo(({
  routeName,
  onDataUpdate
}: {
  routeName: string;
  onDataUpdate: (name: string, data: RouteData) => void
}) => {
  const data = useSortedBusList(routeName);

  useEffect(() => {
    // Immediately update with current data, even if empty
    onDataUpdate(routeName, data);
  }, [routeName, data, onDataUpdate]);

  return null;
});

RouteDataCollector.displayName = 'RouteDataCollector';

/**
 * Displays a list of buses for all routes with real-time location updates.
 * Users can click on a bus to center the map on its location.
 */
export default function BusList({ routeNames, allRoutes, selectedRoute, onRouteChange }: BusListProps) {
  const { map } = useBusContext();
  const [routesData, setRoutesData] = useState<Record<string, RouteData>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update selected route
  const handleRouteChange = useCallback((route: string) => {
    // Clear old route data immediately when switching
    setRoutesData({});
    onRouteChange(route);
  }, [onRouteChange]);

  // Callback to update data for a specific route
  const handleDataUpdate = useCallback((name: string, data: RouteData) => {
    setRoutesData((prev) => {
      const prevData = prev[name];
      // Optimization: Check if data actually changed to prevent unnecessary re-renders
      if (
        prevData &&
        prevData.sortedList === data.sortedList &&
        prevData.error === data.error
      ) {
        return prev;
      }
      return { ...prev, [name]: data };
    });
  }, []);

  // Collect all active route data with proper memoization
  const allRoutesData = useMemo(() => {
    return routeNames
      .map((name) => {
        const data = routesData[name];
        if (!data) return null;
        return { routeName: name, ...data };
      })
      .filter((item): item is ({ routeName: string } & RouteData) => item !== null);
  }, [routeNames, routesData]);

  // Flatten all buses into a single list with proper memoization
  const allBuses = useMemo(() => {
    return allRoutesData.flatMap(({ routeName, sortedList, getDirection }) =>
      sortedList.map((bus) => ({ bus, routeName, getDirection }))
    );
  }, [allRoutesData]);

  // Since we're only loading one route, no filtering needed
  const filteredBuses = useMemo(() => {
    return allBuses;
  }, [allBuses]);

  // Check if any route has errors with proper memoization
  const anyError = useMemo(() => {
    return allRoutesData.find((data) => data.error !== null)?.error || null;
  }, [allRoutesData]);

  const errorMessage = getBusErrorMessage(anyError);
  const isLoading = allRoutesData.length === 0
    || allRoutesData.every((data) => data.sortedList.length === 0 && data.error === null);
  const isNoData = filteredBuses.length === 0;
  const isErrorState = isWarningError(anyError);
  const statusText = anyError
    ? errorMessage
    : isLoading
      ? UI_TEXT.LOADING_BUS_DATA
      : isNoData
        ? UI_TEXT.NO_BUSES_RUNNING
        : UI_TEXT.BUSES_RUNNING(filteredBuses.length);
  const listMessage = anyError
    ? errorMessage
    : isLoading
      ? UI_TEXT.LOADING_BUS_DATA
      : UI_TEXT.NO_BUSES_RUNNING;
  const statusDotClass = isLoading
    ? "bg-blue-300"
    : isErrorState
      ? "bg-red-400"
      : isNoData
        ? "bg-gray-300"
        : "bg-green-400";

  if (APP_CONFIG.IS_DEV) {
    console.debug("[BusList] Current message and state:", {
      statusText,
      listMessage,
      isNoData,
      isErrorState,
      isLoading,
    });
    console.debug("[BusList] Rendered with data:", {
      routeNames,
      selectedRoute,
      routesData,
      allRoutesData,
      allBuses,
      filteredBuses,
      anyError,
      statusText,
      listMessage,
    });
  }

  // Stable callback for bus click handler
  const handleBusClick = useCallback((lat: number, lng: number) => {
    if (map) {
      map.flyTo([lat, lng], map.getZoom(), {
        animate: true,
        duration: MAP_SETTINGS.ANIMATION.FLY_TO_DURATION / 1000,
      });
    }
  }, [map]);

  return (
    <>
      {routeNames.map((name) => (
        <RouteDataCollector
          key={name}
          routeName={name}
          onDataUpdate={handleDataUpdate}
        />
      ))}
      <div className="fixed bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white/98 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl w-56 sm:w-72 z-20 border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-blue-200/50">
        <div className="px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight">
              {UI_TEXT.ROUTE_BUS_LIST(selectedRoute)}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <select
                value={selectedRoute}
                onChange={(e) => handleRouteChange(e.target.value)}
                className="text-xs sm:text-sm bg-white/20 text-white border border-white/30 rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white/30 transition-colors"
              >
                {allRoutes.filter(Boolean).map((routeName) => (
                  <option key={routeName} value={routeName} className="text-gray-800">
                    {routeName}{SCHEDULE_MESSAGES.ROUTE_SUFFIX}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full animate-pulse ${statusDotClass}`}></div>
            <p className="text-xs sm:text-sm text-blue-50 font-medium" aria-live="polite">
              {statusText}
            </p>
          </div>
        </div>

        <ul
          className={`text-xs sm:text-sm text-gray-800 transition-[max-height,opacity] duration-300 ${isCollapsed
            ? "max-h-0 overflow-hidden px-2 py-0 opacity-0 pointer-events-none"
            : "max-h-[100px] sm:max-h-[140px] overflow-y-auto px-2 py-1.5 sm:px-3 sm:py-2 opacity-100 space-y-1 sm:space-y-1.5"
            }`}
        >
          {isNoData ? (
            <li
              className={`py-3 px-2 sm:py-4 sm:px-3 text-xs sm:text-sm text-center rounded-lg ${isErrorState
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}
            >
              {listMessage}
            </li>
          ) : (
            filteredBuses.map(({ bus, routeName, getDirection }) => {
              const direction = bus.nodeid && bus.nodeord !== undefined
                ? getDirection(bus.nodeid, bus.nodeord, bus.routeid)
                : null;
              const DirectionIcon = getDirectionIcon(direction);
              const stopName = bus.nodenm || UI_TEXT.NO_BUSES_SYMBOL;

              return (
                <li key={`${routeName}-${bus.vehicleno}`}>
                  <button
                    type="button"
                    className="flex w-full justify-between items-center py-2 px-2 sm:py-3 sm:px-3 cursor-pointer bg-gradient-to-r from-gray-50 to-blue-50/50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 rounded-lg sm:rounded-xl group border border-transparent hover:border-blue-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-left"
                    onClick={() => handleBusClick(bus.gpslati, bus.gpslong)}
                    aria-label={`${bus.vehicleno} ${UI_TEXT.CURRENT_LOCATION} ${stopName}`}
                  >
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <span className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-700 transition-colors">
                        {bus.vehicleno}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 inline-block w-fit shadow-sm">
                        {routeName}{SCHEDULE_MESSAGES.ROUTE_SUFFIX}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 group-hover:text-gray-900 text-[10px] sm:text-xs text-right max-w-[100px] sm:max-w-[130px] font-medium transition-colors">
                      <span className="truncate" title={stopName}>{stopName}</span>
                      <DirectionIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </>
  );
}
