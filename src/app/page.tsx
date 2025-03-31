// src/app/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";

import { startBusPolling } from "@bus/hooks/useBusLocation";

import NavBar from "@ui/components/NavBar";
import MapWrapper from "@map/components/MapWrapper";
import BusList from "@bus/components/BusList";
import MyLocation from "@bus/components/MyLocation";

export default function Home() {
  const [selectedRouteName, setSelectedRouteName] = useState("30");

  // Memoize the route change callback to prevent unnecessary re-renders.
  const handleRouteChange = useCallback((route: string) => {
    setSelectedRouteName(route);
  }, []);

  useEffect(() => {
    // Start bus polling for the selected route and clean up on unmount or when route changes.
    const cleanupPolling = startBusPolling(selectedRouteName);
    return cleanupPolling;
  }, [selectedRouteName]);

  return (
    <div className="flex flex-col w-full h-[100dvh]">
      <NavBar onRouteChange={handleRouteChange} />

      <div className="relative flex-1 overflow-hidden">
        <MapWrapper routeName={selectedRouteName} />
        <BusList routeName={selectedRouteName} />
        <MyLocation />
      </div>
    </div>
  );
}
