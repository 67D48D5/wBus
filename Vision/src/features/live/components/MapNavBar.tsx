// src/features/live/components/MapNavBar.tsx

"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { APP_NAME } from "@core/constants/env";

export default function MapNavBar() {
  return (
    <nav className="sticky top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-2xl z-70 flex items-center justify-between px-6 border-b-2 border-blue-800/30">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg flex items-center gap-3 animate-fade-in">
          {APP_NAME}
        </h1>
      </div>
    </nav>
  );
}
