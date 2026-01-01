// src/app/schedule/page.tsx

import Link from 'next/link';

import type { Metadata } from 'next';

import RouteCard from '@schedule/components/RouteCard';
import { getAllRoutes } from '@schedule/utils/data';
import { METADATA, UI_TEXT, SITE_INFO } from '@core/constants/locale';
import { COMMON } from '@core/constants/locale';

export const metadata: Metadata = {
  title: METADATA.TITLE,
  description: METADATA.DESCRIPTION,
};

export default async function SchedulePage() {
  const routes = await getAllRoutes();

  return (
    <div className="space-y-6">
      {/* Back to Home */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
        <span>{UI_TEXT.BACK_TO_HOME}</span>
      </Link>

      <header className="text-center py-6">
        <h1 className="text-4xl font-black italic bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
          {COMMON.APP_TITLE}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{SITE_INFO.SHORT_DESCRIPTION}</p>
      </header>

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
              basePath="/schedule"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
