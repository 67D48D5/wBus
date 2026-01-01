// src/features/live/components/MapNavBar.tsx

"use client";

import { APP_NAME } from "@core/constants/env";

export default function MapNavBar() {
  return (
    <nav className="sticky top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-2xl z-70 flex items-center justify-between px-6 border-b-2 border-blue-800/30">
      <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg flex items-center gap-3 animate-fade-in">
        {APP_NAME}
      </h1>
    </nav>
  );
}
