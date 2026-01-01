// src/app/schedule/layout.tsx

import "./globals.css";

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <main className="flex-grow p-4">{children}</main>
      </div>
    </div>
  );
}