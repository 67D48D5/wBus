// src/shared/components/NavBar.tsx

"use client";

import { APP_NAME } from "@core/constants/env";

export default function NavBar() {
  return (
    <nav className="sticky top-0 left-0 w-full h-14 bg-[#003876] shadow-md z-70 flex items-center justify-between px-6">
      <h1 className="text-xl font-extrabold tracking-wide text-white drop-shadow-sm">
        {APP_NAME}
      </h1>
      <div className="flex items-center space-x-3">
        <span className="text-sm text-white/80">전체 노선 표시</span>
      </div>
    </nav>
  );
}
