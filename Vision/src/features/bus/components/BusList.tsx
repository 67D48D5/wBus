// src/features/bus/components/BusList.tsx

"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";

import { APP_CONFIG, MAP_SETTINGS } from "@core/config/env";
import { UI_TEXT } from "@core/config/locale";

import { useBusContext } from "@map/context/MapContext";

import { BusListItem } from "@bus/components/BusListItem";
import { useBusSortedList } from "@bus/hooks/useBusSortedList";
import { getBusErrorMessage, isWarningError } from "@bus/utils/errorMessages";

import Pill from "@shared/ui/Pill";

type BusListProps = {
  routeNames: string[];
  allRoutes: string[];
  selectedRoute: string;
  onRouteChange: (route: string) => void;
};

type RouteData = ReturnType<typeof useBusSortedList>;

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
  const data = useBusSortedList(routeName);

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Check if any route has errors with proper memoization
  const anyError = useMemo(() => {
    return allRoutesData.find((data) => data.error !== null)?.error || null;
  }, [allRoutesData]);

  const errorMessage = getBusErrorMessage(anyError);
  const isLoading = allRoutesData.length === 0
    || allRoutesData.some((data) => !data.hasFetched);
  const isNoData = allBuses.length === 0;
  const isErrorState = isWarningError(anyError);
  const statusText = anyError
    ? errorMessage
    : isLoading
      ? UI_TEXT.COMMON.LOADING
      : isNoData
        ? UI_TEXT.BUS_LIST.NO_RUNNING
        : UI_TEXT.BUS_LIST.COUNT_RUNNING(allBuses.length);
  const listMessage = anyError
    ? errorMessage
    : isLoading
      ? UI_TEXT.COMMON.LOADING_LIVE
      : UI_TEXT.BUS_LIST.NO_RUNNING;
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
        duration: MAP_SETTINGS.ANIMATION.FLY_TO_MS / 1000,
      });
    }
  }, [map]);

  const setMapScroll = useCallback((enabled: boolean) => {
    if (!map?.scrollWheelZoom) return;
    if (enabled) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [map]);

  useEffect(() => {
    return () => setMapScroll(true);
  }, [setMapScroll]);

  return (
    <>
      {routeNames.map((name) => (
        <RouteDataCollector
          key={name}
          routeName={name}
          onDataUpdate={handleDataUpdate}
        />
      ))}
      <div
        className="bg-white/98 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl w-56 sm:w-72 border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-blue-200/50"
        onPointerEnter={() => setMapScroll(false)}
        onPointerLeave={() => setMapScroll(true)}
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight">
              {UI_TEXT.BUS_LIST.TITLE_ROUTE(selectedRoute)}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <select
                value={selectedRoute}
                onChange={(e) => handleRouteChange(e.target.value)}
                className="text-xs sm:text-sm bg-white/20 text-white border border-white/30 rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white/30 transition-colors"
              >
                {allRoutes.filter(Boolean).map((routeName) => (
                  <option key={routeName} value={routeName} className="text-gray-800">
                    {UI_TEXT.BUS_LIST.TITLE_ROUTE(routeName)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full animate-pulse ${statusDotClass}`}></div>
            <p className="text-xs sm:text-sm text-blue-50 font-medium" aria-live="polite">
              {statusText}
            </p>
            <button type="button" onClick={() => setIsExpanded((prev) => !prev)}>
              <Pill tone="light" className="text-[10px]">
                {isExpanded ? UI_TEXT.COMMON.COLLAPSE : UI_TEXT.COMMON.EXPAND}
              </Pill>
            </button>
          </div>
        </div>

        {isExpanded && (
          <ul
            className="text-xs sm:text-sm text-gray-800 max-h-[160px] sm:max-h-[220px] overflow-y-auto overscroll-contain px-2 py-1.5 sm:px-3 sm:py-2 space-y-1 sm:space-y-1.5"
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
              allBuses.map(({ bus, routeName, getDirection }) => (
                <BusListItem
                  key={`${routeName}-${bus.vehicleno}`}
                  bus={bus}
                  routeName={routeName}
                  getDirection={getDirection}
                  onClick={handleBusClick}
                />
              ))
            )}
          </ul>
        )}
      </div>
    </>
  );
}
