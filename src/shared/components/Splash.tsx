// src/shared/components/Splash.tsx

import { APP_NAME, APP_SPLASH_MESSAGE } from "@core/constants/env";

interface SplashProps {
  visible: boolean;
}

export default function Splash({ visible }: SplashProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] bg-[#003876] flex flex-col items-center justify-center
        transition-opacity duration-500 ease-out
        ${
          visible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
    >
      <div className="mb-4">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-white text-4xl font-extrabold tracking-wider">
        {APP_NAME}
      </div>
      <div className="mt-2 text-gray-300 text-sm animate-pulse">
        {APP_SPLASH_MESSAGE}
      </div>
    </div>
  );
}
