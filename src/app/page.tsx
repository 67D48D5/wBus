// src/app/page.tsx

import Link from "next/link";
import { MapPin, Clock, Bus } from "lucide-react";
import { SITE_INFO, UI_TEXT, COMMON } from "@core/constants/locale";

/**
 * Main landing page for wBus application.
 * Provides navigation to real-time bus map and schedule timetable.
 */
export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="pt-16 pb-8 px-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Bus className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-black italic bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
          wBus
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {SITE_INFO.DESCRIPTION}
        </p>
      </header>

      {/* Navigation Cards */}
      <main className="max-w-md mx-auto px-4 pb-16">
        <div className="grid gap-4">
          {/* Real-time Map Card */}
          <Link
            href="/live"
            className="group block p-6 bg-white dark:bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {UI_TEXT.REAL_TIME_LOCATION}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {UI_TEXT.REAL_TIME_LOCATION_DESC}
                </p>
              </div>
              <span className="text-2xl text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200">
                →
              </span>
            </div>
          </Link>

          {/* Schedule/Timetable Card */}
          <Link
            href="/schedule"
            className="group block p-6 bg-white dark:bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:border-purple-400 dark:hover:border-purple-600 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {UI_TEXT.SCHEDULE_INQUIRY}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {UI_TEXT.SCHEDULE_INQUIRY_DESC}
                </p>
              </div>
              <span className="text-2xl text-slate-300 dark:text-slate-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-200">
                →
              </span>
            </div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {SITE_INFO.FOOTER_TEXT}
          </p>
        </div>
      </main>
    </div>
  );
}
