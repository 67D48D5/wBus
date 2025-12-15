// src/shared/components/NavBar.tsx

"use client";

import { APP_NAME } from "@core/constants/env";

export default function NavBar() {
  return (
    <nav className="sticky top-0 left-0 w-full h-16 bg-gradient-to-r from-[#003876] to-[#0052a3] shadow-lg z-70 flex items-center justify-between px-6">
      <h1 className="text-2xl font-extrabold tracking-wide text-white drop-shadow-md flex items-center gap-2">
        <span className="text-3xl">🚌</span>
        {APP_NAME}
      </h1>
      <div className="flex items-center space-x-3">
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
          <span className="text-sm font-semibold text-white">전체 노선 표시</span>
        </div>
      </div>
    </nav>
  );
}
