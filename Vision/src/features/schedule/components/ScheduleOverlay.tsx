// src/features/schedule/components/ScheduleOverlay.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";

import { UI_TEXT } from "@core/config/locale";

import { useBusContext } from "@map/context/MapContext";

import { useScheduleData } from "@schedule/hooks/useScheduleData";
import { formatTime, getNearestBusTime } from "@schedule/utils/time";

import ScheduleView from "@schedule/components/ScheduleView";

import Pill from "@shared/ui/Pill";

import type { BusSchedule } from "@core/domain/schedule";

type ScheduleOverlayProps = {
  routeId: string;
};

type NearestBus = {
  time: string;
  minutes: number;
  destination: string;
};

function SchedulePreview({ data, tone = "light" }: { data: BusSchedule; tone?: "light" | "muted" }) {
  const [nearestBus, setNearestBus] = useState<NearestBus | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateTime = () => {
      setNearestBus(getNearestBusTime(data));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [data, mounted]);

  if (!mounted) {
    return (
      <span className="text-[11px] font-semibold text-slate-400">
        {UI_TEXT.COMMON.LOADING}
      </span>
    );
  }

  if (!nearestBus) {
    return (
      <span className={tone === "light" ? "text-[11px] text-blue-100/80" : "text-[11px] text-slate-400"}>
        {UI_TEXT.SCHEDULE.NO_SERVICE}
      </span>
    );
  }

  const [hour, minute] = nearestBus.time.split(":");
  const displayTime = minute ? formatTime(hour, minute) : nearestBus.time;
  const hours = Math.floor(nearestBus.minutes / 60);
  const mins = nearestBus.minutes % 60;
  const remainingText = hours > 0
    ? `${hours}${UI_TEXT.TIME.HOUR_SUFFIX} ${mins}${UI_TEXT.TIME.MINUTE_SUFFIX}`
    : `${mins}${UI_TEXT.TIME.MINUTE_SUFFIX}`;
  const primaryText = tone === "light" ? "text-white" : "text-slate-800";
  const secondaryText = tone === "light" ? "text-blue-100/80" : "text-slate-500";
  const badgeTone = tone === "light" ? "light" : "soft";

  return (
    <Pill tone={badgeTone} className="gap-3">
      <span className="text-[10px] font-semibold">{nearestBus.destination}</span>
      <span className={`text-sm font-mono font-bold ${primaryText}`}>{displayTime}</span>
      <span className={`text-[10px] font-semibold ${secondaryText}`}>{remainingText}</span>
    </Pill>
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

function ScheduleCompactSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-14 rounded-xl bg-slate-100" />
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

export default function ScheduleOverlay({ routeId }: ScheduleOverlayProps) {
  const { data, loading, error, missing } = useScheduleData(routeId);
  const [isOpen, setIsOpen] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const { map } = useBusContext();

  const routeDescription = data?.description;

  const setMapScroll = useCallback((enabled: boolean) => {
    if (!map?.scrollWheelZoom) return;
    if (enabled) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [map]);

  useEffect(() => {
    if (missing) {
      setMapScroll(true);
    }
  }, [missing, setMapScroll]);

  useEffect(() => {
    return () => setMapScroll(true);
  }, [setMapScroll]);

  useEffect(() => {
    if (!isOpen) {
      setShowFull(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setMapScroll(!isOpen);
  }, [isOpen, setMapScroll]);

  useEffect(() => {
    setShowFull(false);
  }, [routeId]);

  if (missing) {
    return null;
  }

  return (
    <div
      className="w-56 sm:w-72"
      onPointerEnter={() => setMapScroll(false)}
      onPointerLeave={() => setMapScroll(true)}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="overflow-hidden rounded-xl border border-gray-200/50 bg-white/98 shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-blue-200/40 sm:rounded-2xl">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-3 py-3 text-left sm:px-4"
          aria-expanded={isOpen}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
                  <CalendarClock className="h-3.5 w-3.5" />
                </span>
                {routeDescription && (
                  <p className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight">{routeDescription}</p>
                )}
              </div>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-white/80" />
            <span className="text-[11px] font-semibold text-blue-100">
              {UI_TEXT.SCHEDULE.NEXT_BUS}
            </span>
            {data ? (
              <SchedulePreview data={data} tone="light" />
            ) : (
              <span className="text-[11px] text-blue-100/80">
                {loading ? UI_TEXT.COMMON.LOADING : UI_TEXT.SCHEDULE.NO_SERVICE}
              </span>
            )}
          </div>
        </button>
        {isOpen && (
          <div className="max-h-[60svh] overflow-y-auto overscroll-contain px-3 py-3 text-slate-800 custom-scrollbar sm:max-h-[calc(100svh-460px)] sm:px-4">
            {loading ? (
              showFull ? <ScheduleSkeleton /> : <ScheduleCompactSkeleton />
            ) : error ? (
              <ScheduleEmptyState message={error} />
            ) : data ? (
              <>
                {!showFull ? (
                  <ScheduleView data={data} mode="compact" />
                ) : (
                  <ScheduleView data={data} mode="full" />
                )}
                {showFull && <ScheduleView data={data} mode="full" />}
                <button
                  type="button"
                  onClick={() => setShowFull((prev) => !prev)}
                  className="mt-3 w-full rounded-lg border border-blue-100 bg-blue-50 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                >
                  {showFull ? "간단히 보기" : "자세히 보기"}
                </button>
              </>
            ) : (
              <ScheduleEmptyState message={UI_TEXT.SCHEDULE.NO_SERVICE} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
