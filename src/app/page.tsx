// src/app/page.tsx

import type { Metadata } from 'next';

import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { COMMON } from '@core/constants/locale';
import { METADATA, UI_TEXT, SITE_INFO } from '@core/constants/locale';

import RouteCard from '@schedule/components/RouteCard';
import { getAllRoutes } from '@schedule/utils/data';

export const metadata: Metadata = {
  title: METADATA.TITLE,
  description: METADATA.DESCRIPTION,
};

export default async function HomePage() {
  const routes = await getAllRoutes();

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <main className="flex-grow p-4">
          <div className="space-y-6">
            <header className="text-center py-6">
              <h1 className="text-4xl font-black italic bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                {COMMON.APP_TITLE}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{SITE_INFO.SHORT_DESCRIPTION}</p>
            </header>

            {/* Route Cards */}
            <div className="grid gap-3">
              {routes.map((route, index) => (
                <div
                  key={route.routeId}
                  style={{ animationDelay: `${index * 50}ms` }}
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

            {/* Separator */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{UI_TEXT.REAL_TIME_LOCATION}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
            </div>

            {/* Live Map Card */}
            <div
              style={{ animationDelay: `${routes.length * 50}ms` }}
              className="animate-fade-in-up"
            >
              <Link
                href="/live"
                className="block p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 backdrop-blur rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-400 dark:hover:border-emerald-600 hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-200">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                        {UI_TEXT.REAL_TIME_LOCATION}
                      </span>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{UI_TEXT.REAL_TIME_LOCATION_DESC}</p>
                    </div>
                  </div>
                  <span className="text-2xl text-emerald-300 dark:text-emerald-700 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-200">→</span>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
