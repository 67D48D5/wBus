// src/features/live/components/Splash.tsx

import { useState, useEffect } from "react";

import { APP_CONFIG, UI_CONFIG } from "@core/config/env";

interface SplashProps {
  /** Controls the visibility of the splash screen */
  isVisible: boolean;
  /** Animation duration in milliseconds for fade out transition (default: 500ms) */
  duration?: number;
  /** Whether to show the loading spinner (default: true) */
  showLoader?: boolean;
}

/**
 * Splash screen component that displays during app initialization.
 * Provides a smooth fade-out transition when the app is ready.
 */
export default function Splash({
  isVisible,
  duration = UI_CONFIG.SPLASH_FADE_DURATION,
  showLoader = true,
}: SplashProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  // This useEffect ensures the component stays mounted during the fade-out transition
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col items-center justify-center
        transition-opacity ease-out
        ${isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {showLoader && (
          <div className="mb-6">
            <div className="w-14 h-14 border-5 border-white/30 border-t-white rounded-full animate-spin shadow-2xl" />
          </div>
        )}

        <div className="text-white text-5xl font-extrabold tracking-tight drop-shadow-2xl mb-3 animate-bounce">
          {APP_CONFIG.NAME}
        </div>

        <div className="flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-xl">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <div className="text-blue-50 text-sm font-medium tracking-wide">
            {APP_CONFIG.SPLASH_MESSAGE}
          </div>
        </div>
      </div>
    </div>
  );
}
