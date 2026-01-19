// src/shared/ui/NavBar.tsx

"use client";

import { MapIcon } from "lucide-react";

import { APP_CONFIG } from "@core/config/env";

export default function NavBar() {
  return (
    <nav className="absolute top-4 left-4 z-50">
      <div className="flex items-center gap-2 p-1.5 pr-5 bg-white/90 backdrop-blur-md border border-white/20 shadow-lg rounded-full">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
          <MapIcon className="w-5 h-5" />
        </div>

        <h1 className="text-sm font-bold text-slate-800 tracking-tight">
          {APP_CONFIG.NAME}
        </h1>
      </div>
    </nav>
  );
}