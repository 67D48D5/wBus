// src/app/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { busPollingService } from "@bus/services/BusPollingService";

import Splash from "@shared/components/Splash";
import NavBar from "@shared/components/NavBar";
import MapWrapper from "@map/components/MapWrapper";
import BusList from "@bus/components/BusList";
import MyLocation from "@bus/components/MyLocation";

/**
 * Main home page component for the wBus application.
 * Displays real-time bus location information on a map with route selection.
 */
export default function Home() {
  const [selectedRouteNames, setSelectedRouteNames] = useState<string[]>([
    "30",
  ]);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleRouteChange = useCallback((route: string) => {
    setSelectedRouteNames([route]);
  }, []);

  // Effect for handling initial app loading and the splash screen
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize app, fetch initial data
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Wait minimum display time for splash screen (300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      setIsSplashVisible(false);
    };

    initializeApp();
  }, []);

  // Effect to start bus polling once the route is selected
  useEffect(() => {
    const cleanupFunctions = selectedRouteNames.map((routeName) =>
      busPollingService.startPolling(routeName)
    );

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [selectedRouteNames]);

  return (
    <>
      <Splash isVisible={isSplashVisible} />
      <div className="flex flex-col w-full h-[100dvh]">
        <NavBar onRouteSelect={handleRouteChange} />
        <div className="relative flex-1 overflow-hidden">
          {selectedRouteNames.length > 0 && (
            <>
              <MapWrapper routeName={selectedRouteNames[0]} />
              <BusList routeName={selectedRouteNames[0]} />
            </>
          )}
          <MyLocation />
        </div>
      </div>
    </>
  );
}
