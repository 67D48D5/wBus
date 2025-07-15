// src/app/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";

import { startBusPolling } from "@bus/hooks/useBusLocation";

import Splash from "@shared/components/Splash";
import NavBar from "@shared/components/NavBar";

import MapWrapper from "@map/components/MapWrapper";

import MyLocation from "@bus/components/MyLocation";
import BusList from "@bus/components/BusList";

export default function Home() {
  const [selectedRouteNames, setSelectedRouteNames] = useState<string[]>([
    "30",
  ]);
  const [showSplash, setShowSplash] = useState(true);

  const handleRouteChange = useCallback((route: string) => {
    setSelectedRouteNames([route]); // 앞으로 다중 선택 허용할 예정
  }, []);

  useEffect(() => {
    const cleanupPolling = startBusPolling(selectedRouteNames);
    return cleanupPolling;
  }, [selectedRouteNames]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Splash visible={showSplash} />

      <div className="flex flex-col w-full h-[100dvh]">
        <NavBar onRouteChange={handleRouteChange} />

        <div className="relative flex-1 overflow-hidden">
          {/* 여러 노선의 폴리라인과 마커 렌더링 */}
          {selectedRouteNames.map((routeName) => (
            <MapWrapper key={routeName} routeName={routeName} />
          ))}
          {selectedRouteNames.map((routeName) => (
            <BusList key={routeName} routeName={routeName} />
          ))}
          <MyLocation />
        </div>
      </div>
    </>
  );
}
