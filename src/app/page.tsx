// src/app/page.tsx

"use client";

import { useEffect, useState } from "react";

import { startBusPolling } from "@/hooks/useBusData";

import NavBar from "@/components/NavBar";
import MapWrapper from "@/components/MapWrapper";
import BusList from "@/components/BusList";
import MyLocation from "@/components/MyLocation";

export default function Home() {
  const [selectedRouteName, setSelectedRouteName] = useState("30");

  useEffect(() => {
    const stop = startBusPolling(selectedRouteName);
    return stop;
  }, [selectedRouteName]);

  return (
    <div className="flex flex-col w-full h-[100dvh]">
      <NavBar
        onRouteChange={(route) => {
          setSelectedRouteName(route);
        }}
      />

      <div className="relative flex-1 overflow-hidden">
        <MapWrapper routeName={selectedRouteName} />

        <BusList routeName={selectedRouteName} />
        <MyLocation />
      </div>
    </div>
  );
}
