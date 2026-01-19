// src/features/schedule/components/ScheduleOverlay.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, X } from "lucide-react";

import { UI_TEXT } from "@core/config/locale";

import { BusData } from "@core/domain/schedule";
import { formatTime, getNearestBusTime } from "@schedule/utils/time";
import { useScheduleData } from "@schedule/hooks/useScheduleData";

import TimetableView from "@schedule/components/TimetableView";

type ScheduleOverlayProps = {
  routeId: string;
};

type NearestBus = {
  time: string;
  minutes: number;
  destination: string;
};

function SchedulePreview({ data, tone = "dark" }: { data: BusData; tone?: "dark" | "light" }) {
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
  const primaryText = tone === "light" ? "text-white" : "text-slate-900";
  const secondaryText = tone === "light" ? "text-blue-100/80" : "text-slate-500";
  const badgeStyle = tone === "light"
    ? "bg-white/20 text-white"
    : "bg-blue-50 text-blue-600";

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeStyle}`}>
        {nearestBus.destination}
      </span>
      <span className={`text-sm font-mono font-bold ${primaryText}`}>{displayTime}</span>
      <span className={`text-[10px] font-semibold ${secondaryText}`}>{remainingText}</span>
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

export default function ScheduleOverlay({ routeId }: ScheduleOverlayProps) {
  const { data, loading, error } = useScheduleData(routeId);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setIsOpen(true);
    }
  }, []);

  const routeTitle = useMemo(() => {
    if (data?.routeName) return data.routeName;
    return UI_TEXT.BUS_LIST.TITLE_ROUTE(routeId);
  }, [data?.routeName, routeId]);

  const routeDescription = data?.description;

  return (
    <div className="fixed right-2 top-16 z-30 flex flex-col items-end gap-2 sm:right-4 sm:top-6">
      {isOpen ? (
        <div className="flex h-[70dvh] w-[320px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-2xl backdrop-blur-md sm:h-[calc(100dvh-120px)] sm:w-[380px]">
          <div className="bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-100">
                  {UI_TEXT.SCHEDULE.TIMETABLE}
                </p>
                <h2 className="truncate text-lg font-bold text-white">{routeTitle}</h2>
                {routeDescription && (
                  <p className="truncate text-xs text-blue-100/80">{routeDescription}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                aria-label={UI_TEXT.COMMON.CANCEL}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
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
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 pt-3 text-slate-800 custom-scrollbar sm:px-4">
            {loading ? (
              <ScheduleSkeleton />
            ) : error ? (
              <ScheduleEmptyState message={error} />
            ) : data ? (
              <TimetableView data={data} />
            ) : (
              <ScheduleEmptyState message={UI_TEXT.SCHEDULE.NO_SERVICE} />
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/90 px-3 py-2 text-left shadow-xl backdrop-blur-md transition hover:border-blue-300 hover:shadow-blue-200/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              {UI_TEXT.SCHEDULE.TIMETABLE}
            </p>
            {data ? (
              <SchedulePreview data={data} />
            ) : (
              <span className="text-xs text-slate-400">
                {loading ? UI_TEXT.COMMON.LOADING : UI_TEXT.SCHEDULE.NO_SERVICE}
              </span>
            )}
          </div>
        </button>
      )}
    </div>
  );
}
