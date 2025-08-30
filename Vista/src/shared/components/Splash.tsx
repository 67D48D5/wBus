// src/shared/components/Splash.tsx

import { useState, useEffect } from "react";
import { APP_NAME, APP_SPLASH_MESSAGE } from "@core/constants/env";

interface SplashProps {
  isVisible: boolean; // prop name changed for clarity
  duration?: number; // add a new prop for animation duration
  showLoader?: boolean; // add a new prop to control the loader
}

export default function Splash({ isVisible, duration = 500, showLoader = true }: SplashProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  // This useEffect ensures the component stays mounted during the fade-out
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer); // Clean up the timer
    }
  }, [isVisible, duration]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] bg-[#003876] flex flex-col items-center justify-center
        transition-opacity ease-out
        ${isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {/* Conditionally render the loader */}
      {showLoader && (
        <div className="mb-4">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="text-white text-4xl font-extrabold tracking-wider">
        {APP_NAME}
      </div>
      <div className="mt-2 text-gray-300 text-sm animate-pulse">
        {APP_SPLASH_MESSAGE}
      </div>
    </div>
  );
}
