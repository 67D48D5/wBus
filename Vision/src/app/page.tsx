// src/app/page.tsx

import Link from 'next/link';
import { MapPin, Clock, Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react';

import { COMMON, METADATA, UI_TEXT, SITE_INFO, FOOTER, NOTICE } from '@core/config/locale';

import { getAllRoutes, getNotices } from '@schedule/api/getScheduleData';
import RouteCard from '@schedule/components/RouteCard';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: METADATA.TITLE,
  description: METADATA.DESCRIPTION,
};

const noticeIcons = {
  info: Info,
  warning: AlertTriangle,
  urgent: AlertCircle,
};

const noticeStyles = {
  info: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
  warning: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
  urgent: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
};

const noticeIconStyles = {
  info: 'text-blue-500 dark:text-blue-400',
  warning: 'text-amber-500 dark:text-amber-400',
  urgent: 'text-red-500 dark:text-red-400',
};

export default async function HomePage() {
  const routes = await getAllRoutes();
  const notices = await getNotices();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-lg mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
          <div className="px-5 py-4">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {COMMON.APP_TITLE}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{SITE_INFO.SHORT_DESCRIPTION}</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow px-4 py-5">
          <div className="space-y-5">
            {/* Live Map Card - Featured at top */}
            <div className="animate-fade-in">
              <Link
                href="/live"
                className="relative block overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group"
              >
                <div className="relative p-5">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-300/20 rounded-full blur-xl" />

                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <MapPin className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                          Live
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-0.5">
                        {UI_TEXT.REAL_TIME_LOCATION}
                      </h2>
                      <p className="text-sm text-white/80">{UI_TEXT.REAL_TIME_LOCATION_DESC}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                      <span className="text-xl text-white">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Notice Section */}
            {notices.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 px-1">
                  <Bell className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{NOTICE.SECTION_TITLE}</span>
                </div>
                {notices.map((notice) => {
                  const IconComponent = noticeIcons[notice.type];
                  return (
                    <div
                      key={notice.id}
                      className={`p-4 rounded-xl border ${noticeStyles[notice.type]}`}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`w-5 h-5 mt-0.5 shrink-0 ${noticeIconStyles[notice.type]}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{notice.title}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notice.message}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block">{notice.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section Title */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{UI_TEXT.TIMETABLE_SUFFIX}</h2>
            </div>

            {/* Route Cards */}
            <div className="space-y-3">
              {routes.map((route, index) => (
                <div
                  key={route.routeId}
                  style={{ animationDelay: `${(index + 1) * 80}ms` }}
                  className="animate-fade-in-up"
                >
                  <RouteCard
                    routeId={route.routeId}
                    routeName={route.routeName}
                    description={route.description}
                    busData={route}
                    basePath=""
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="px-5 py-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{FOOTER.COPYRIGHT}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{FOOTER.DESCRIPTION}</p>
              <div className="flex items-center gap-4">
                {FOOTER.LINKS.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs">{FOOTER.DISCLAIMER}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
