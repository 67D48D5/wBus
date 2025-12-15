// src/app/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { busPollingService } from "@bus/services/BusPollingService";
import { useRouteMap } from "@bus/hooks/useRouteMap";

import Splash from "@shared/components/Splash";
import NavBar from "@shared/components/NavBar";
import MapWrapper from "@map/components/MapWrapper";
import BusList from "@bus/components/BusList";
import MyLocation from "@bus/components/MyLocation";

/**
 * Main home page component for the wBus application.
 * Displays real-time bus location information on a map for all routes.
 */
export default function Home() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const routeMap = useRouteMap();
  const allRoutes = useMemo(() => routeMap ? Object.keys(routeMap) : [], [routeMap]);

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

  // Effect to start bus polling for all routes
  useEffect(() => {
    if (allRoutes.length === 0) return;

    const cleanupFunctions = allRoutes.map((routeName) =>
      busPollingService.startPolling(routeName)
    );

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [allRoutes]);

  return (
    <>
      <Splash isVisible={isSplashVisible} />
      <div className="flex flex-col w-full h-[100dvh]">
        <NavBar />
        <div className="relative flex-1 overflow-hidden">
          {allRoutes.length > 0 && (
            <>
              <MapWrapper routeNames={allRoutes} />
              <BusList routeNames={allRoutes} />
            </>
          )}
          <MyLocation />
        </div>
      </div>
    </>
  );
}
