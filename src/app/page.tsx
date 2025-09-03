// src/app/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { startBusPolling } from "@bus/hooks/useBusLocation";

import Splash from "@shared/components/Splash";
import NavBar from "@shared/components/NavBar";
import MapWrapper from "@map/components/MapWrapper";
import BusList from "@bus/components/BusList";
import MyLocation from "@bus/components/MyLocation";

export default function Home() {
  const [selectedRouteNames, setSelectedRouteNames] = useState<string[]>([
    "30",
  ]);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashTimerDone, setIsSplashTimerDone] = useState(false);

  const handleRouteChange = useCallback((route: string) => {
    setSelectedRouteNames([route]);
  }, []);

  // Effect for handling initial app loading and the splash screen timer
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const initializeApp = async () => {
      // Step 1: Initialize your app, fetch initial data, etc.
      // For now, we'll simulate a fetch with a short delay.
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: Once app-specific logic is done, set the 'ready' state.
      setIsAppReady(true);
    };

    // Start the app initialization process.
    initializeApp();

    // Set a timer to ensure the splash screen is displayed for a minimum of 0.3 seconds.
    timer = setTimeout(() => {
      setIsSplashTimerDone(true);
    }, 300); // 300ms = 0.3 second

    // Cleanup the timer if the component unmounts.
    return () => clearTimeout(timer);
  }, []);

  // Effect to start bus polling once the route is selected
  useEffect(() => {
    const cleanupPolling = startBusPolling(selectedRouteNames);
    return cleanupPolling;
  }, [selectedRouteNames]);

  // The splash screen is visible only if the app is NOT ready OR the timer is NOT done.
  const shouldShowSplash = !isAppReady || !isSplashTimerDone;

  return (
    <>
      <Splash isVisible={shouldShowSplash} />
      <div className="flex flex-col w-full h-[100dvh]">
        <NavBar onRouteSelect={handleRouteChange} />
        <div className="relative flex-1 overflow-hidden">
          {/* Combine the two mapping loops into one for efficiency */}
          {selectedRouteNames.map((routeName) => (
            <div key={routeName} className="w-full h-full">
              <MapWrapper routeName={routeName} />
              <BusList routeName={routeName} />
            </div>
          ))}
          <MyLocation />
        </div>
      </div>
    </>
  );
}
