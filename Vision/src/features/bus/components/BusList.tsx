// src/features/bus/components/BusList.tsx

"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";

import { APP_CONFIG, MAP_SETTINGS } from "@core/config/env";
import { UI_TEXT } from "@core/config/locale";

import { useBusContext } from "@map/context/MapContext";

import { BusListItem } from "@bus/components/BusListItem";
import { useBusSortedList } from "@bus/hooks/useBusSortedList";
import { getBusErrorMessage, isWarningError } from "@bus/utils/errorMessages";

import { useScheduleData } from "@schedule/hooks/useScheduleData";
import { formatTime, getNearestBusTime } from "@schedule/utils/time";

import ScheduleView from "@schedule/components/ScheduleView";

import Pill from "@shared/ui/Pill";

import type { BusSchedule } from "@core/domain/schedule";

//-------------------------------------------------------------------
// Types
//-------------------------------------------------------------------

type BusListProps = {
  routeNames: string[];
  allRoutes: string[];
  selectedRoute: string;
  onRouteChange: (route: string) => void;
};

type RouteData = ReturnType<typeof useBusSortedList>;

type NearestBus = {
  time: string;
  minutes: number;
  destination: string;
};

type ExpandedPanel = "bus" | "schedule" | null;

//-------------------------------------------------------------------
// Helper Functions & Constants
//-------------------------------------------------------------------

function getUrgencyClass(minutes: number): string {
  if (minutes <= 3) return "bg-red-400";
  if (minutes <= 7) return "bg-amber-400";
  if (minutes <= 15) return "bg-emerald-400";
  return "bg-sky-300";
}

const STYLES = {
  CONTAINER: "bg-white/98 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl w-56 sm:w-72 border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-blue-200/50",
  HEADER: "px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-t-xl sm:rounded-t-2xl",
  SELECT: "text-xs sm:text-sm bg-white/20 text-white border border-white/30 rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white/30 transition-colors",
  INFO_TEXT: "text-[11px] sm:text-xs font-semibold",
  LIST_CONTAINER: "text-xs sm:text-sm text-gray-800 max-h-[160px] sm:max-h-[220px] overflow-y-auto overscroll-contain px-2 py-1.5 sm:px-3 sm:py-2 space-y-1 sm:space-y-1.5",
  SCHEDULE_CONTAINER: "max-h-[60svh] overflow-y-auto overscroll-contain px-3 py-3 text-slate-800 custom-scrollbar sm:max-h-[calc(100svh-460px)] sm:px-4",
};

//-------------------------------------------------------------------
// Sub-Components
//-------------------------------------------------------------------

/**
 * RouteDataCollector
 * Fetches data for a single route and bubbles it up to the parent.
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
    onDataUpdate(routeName, data);
  }, [routeName, data, onDataUpdate]);

  return null;
});
RouteDataCollector.displayName = 'RouteDataCollector';

/**
 * SchedulePreview
 * Displays a compact next-bus preview.
 */
function SchedulePreview({ data, loading }: { data: BusSchedule | null; loading: boolean }) {
  const [nearestBus, setNearestBus] = useState<NearestBus | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !data) {
      setNearestBus(null);
      return;
    }

    const updateTime = () => setNearestBus(getNearestBusTime(data));
    updateTime();

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [data, mounted]);

  const statusMessage = loading || !mounted ? UI_TEXT.COMMON.LOADING : UI_TEXT.SCHEDULE.NO_SERVICE;
  const dotClass = nearestBus ? getUrgencyClass(nearestBus.minutes) : "bg-white/40";

  const displayTime = useMemo(() => {
    if (!nearestBus) return "";
    const [hour, minute] = nearestBus.time.split(":");
    return hour && minute ? formatTime(hour, minute) : nearestBus.time;
  }, [nearestBus]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${dotClass}`} />
      <span className={`${STYLES.INFO_TEXT} text-blue-100`}>{UI_TEXT.SCHEDULE.NEXT_BUS}</span>

      {nearestBus ? (
        <div className="flex items-center gap-2">
          <Pill tone="light" size="sm">
            <span className={`${STYLES.INFO_TEXT} text-white`}>{nearestBus.destination}</span>
            <span className={`${STYLES.INFO_TEXT} text-white`}>{displayTime}</span>
          </Pill>
          <Pill tone="light" size="sm">
            <span className={`${STYLES.INFO_TEXT} text-white`}>
              {UI_TEXT.TIME.FORMAT_REMAINING(nearestBus.minutes)}
            </span>
          </Pill>
        </div>
      ) : (
        <span className={`${STYLES.INFO_TEXT} text-blue-100/80`}>{statusMessage}</span>
      )}
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-24 rounded-xl bg-slate-100" />
      <div className="h-40 rounded-xl bg-slate-100" />
    </div>
  );
}

function ScheduleEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

//-------------------------------------------------------------------
// Main Component
//-------------------------------------------------------------------

export default function BusList({ routeNames, allRoutes, selectedRoute, onRouteChange }: BusListProps) {
  const { map } = useBusContext();
  const [routesData, setRoutesData] = useState<Record<string, RouteData>>({});
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);

  // Schedule Data Hook
  const {
    data: scheduleData,
    loading: scheduleLoading,
    error: scheduleError,
    missing: scheduleMissing
  } = useScheduleData(selectedRoute);

  const isBusExpanded = expandedPanel === "bus";
  const isScheduleExpanded = expandedPanel === "schedule";
  const showSchedule = !scheduleMissing;

  // Handlers

  const handleRouteChange = useCallback((route: string) => {
    setRoutesData({}); // Reset data on route switch
    onRouteChange(route);
  }, [onRouteChange]);

  const togglePanel = useCallback((panel: "bus" | "schedule") => {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  }, []);

  const handleDataUpdate = useCallback((name: string, data: RouteData) => {
    setRoutesData((prev) => {
      const prevData = prev[name];
      // Optimization: Avoid re-render if data is identical
      if (prevData && prevData.sortedList === data.sortedList && prevData.error === data.error) {
        return prev;
      }
      return { ...prev, [name]: data };
    });
  }, []);

  const handleBusClick = useCallback((lat: number, lng: number) => {
    map?.flyTo([lat, lng], map.getZoom(), {
      animate: true,
      duration: MAP_SETTINGS.ANIMATION.FLY_TO_MS / 1000,
    });
  }, [map]);

  const setMapScroll = useCallback((enabled: boolean) => {
    if (!map?.scrollWheelZoom) return;
    enabled ? map.scrollWheelZoom.enable() : map.scrollWheelZoom.disable();
  }, [map]);

  // Effects

  // Auto-close schedule panel if data goes missing
  useEffect(() => {
    if (scheduleMissing && isScheduleExpanded) {
      setExpandedPanel(null);
    }
  }, [scheduleMissing, isScheduleExpanded]);

  // Restore map scroll on unmount
  useEffect(() => {
    return () => setMapScroll(true);
  }, [setMapScroll]);

  // Derived State (Data Processing)

  const allRoutesData = useMemo(() => {
    return routeNames
      .map(name => routesData[name] ? { routeName: name, ...routesData[name] } : null)
      .filter((item): item is { routeName: string } & RouteData => item !== null);
  }, [routeNames, routesData]);

  const allBuses = useMemo(() => {
    return allRoutesData.flatMap(({ routeName, sortedList, getDirection }) =>
      sortedList.map(bus => ({ bus, routeName, getDirection }))
    );
  }, [allRoutesData]);

  const uiState = useMemo(() => {
    const anyError = allRoutesData.find(d => d.error !== null)?.error || null;
    const errorMessage = getBusErrorMessage(anyError);
    const isLoading = allRoutesData.length === 0 || allRoutesData.some(d => !d.hasFetched);
    const isNoData = allBuses.length === 0;
    const isErrorState = isWarningError(anyError);

    let statusText: string = UI_TEXT.BUS_LIST.COUNT_RUNNING(allBuses.length);
    let listMessage: string = UI_TEXT.BUS_LIST.NO_RUNNING;
    let statusDotClass: string = "bg-green-400";

    if (anyError) {
      statusText = errorMessage;
      listMessage = errorMessage;
      statusDotClass = "bg-red-400";
    } else if (isLoading) {
      statusText = UI_TEXT.COMMON.LOADING;
      listMessage = UI_TEXT.COMMON.LOADING_LIVE;
      statusDotClass = "bg-blue-300";
    } else if (isNoData) {
      statusText = UI_TEXT.BUS_LIST.NO_RUNNING;
      listMessage = UI_TEXT.BUS_LIST.NO_RUNNING;
      statusDotClass = "bg-gray-300";
    }

    return {
      statusText,
      listMessage,
      statusDotClass,
      isNoData,
      isErrorState
    };
  }, [allRoutesData, allBuses]);

  // Render Helpers

  const renderScheduleContent = () => {
    if (scheduleLoading) return <ScheduleSkeleton />;
    if (scheduleError) return <ScheduleEmptyState message={scheduleError} />;
    if (scheduleData) return <ScheduleView data={scheduleData} mode="full" />;
    return <ScheduleEmptyState message={UI_TEXT.SCHEDULE.NO_SERVICE} />;
  };

  const renderBusListContent = () => {
    if (uiState.isNoData) {
      const colorClass = uiState.isErrorState
        ? "bg-red-50 text-red-600 border border-red-200"
        : "bg-gray-50 text-gray-500 border border-gray-200";

      return (
        <li className={`py-3 px-2 sm:py-4 sm:px-3 text-xs sm:text-sm text-center rounded-lg ${colorClass}`}>
          {uiState.listMessage}
        </li>
      );
    }

    return allBuses.map(({ bus, routeName, getDirection }) => (
      <BusListItem
        key={`${routeName}-${bus.vehicleno}`}
        bus={bus}
        routeName={routeName}
        getDirection={getDirection}
        onClick={handleBusClick}
      />
    ));
  };

  return (
    <>
      {/* Hidden Data Collectors */}
      {routeNames.map((name) => (
        <RouteDataCollector
          key={name}
          routeName={name}
          onDataUpdate={handleDataUpdate}
        />
      ))}

      {/* Main UI Panel */}
      <div
        className={STYLES.CONTAINER}
        onPointerEnter={() => setMapScroll(false)}
        onPointerLeave={() => setMapScroll(true)}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className={STYLES.HEADER}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight">
              {UI_TEXT.BUS_LIST.TITLE_ROUTE(selectedRoute)}
            </h2>
            <select
              value={selectedRoute}
              onChange={(e) => handleRouteChange(e.target.value)}
              className={STYLES.SELECT}
            >
              {allRoutes.filter(Boolean).map((route) => (
                <option key={route} value={route} className="text-gray-800">
                  {UI_TEXT.BUS_LIST.TITLE_ROUTE(route)}
                </option>
              ))}
            </select>
          </div>

          {showSchedule && <SchedulePreview data={scheduleData} loading={scheduleLoading} />}

          {/* Control Buttons & Status */}
          <div className={`flex flex-wrap items-center gap-2 ${showSchedule ? "mt-2" : ""}`}>
            <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full animate-pulse ${uiState.statusDotClass}`} />
            <p className={`${STYLES.INFO_TEXT} text-blue-50`} aria-live="polite">
              {uiState.statusText}
            </p>

            <button type="button" onClick={() => togglePanel("bus")} aria-expanded={isBusExpanded}>
              <Pill tone={isBusExpanded ? "glass" : "light"} size="sm">
                {isBusExpanded ? UI_TEXT.NAV.HIDE_LIST : UI_TEXT.NAV.SHOW_LIST}
              </Pill>
            </button>

            {showSchedule && (
              <button type="button" onClick={() => togglePanel("schedule")} aria-expanded={isScheduleExpanded}>
                <Pill tone={isScheduleExpanded ? "glass" : "light"} size="sm">
                  {isScheduleExpanded ? UI_TEXT.SCHEDULE.HIDE_DETAILS : UI_TEXT.SCHEDULE.SHOW_DETAILS}
                </Pill>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Panels */}
        {isScheduleExpanded && showSchedule && (
          <div className={STYLES.SCHEDULE_CONTAINER}>
            {renderScheduleContent()}
          </div>
        )}

        {isBusExpanded && (
          <ul className={STYLES.LIST_CONTAINER}>
            {renderBusListContent()}
          </ul>
        )}
      </div>
    </>
  );
}
