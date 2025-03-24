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
    <div className="w-full h-screen relative">
      {/* Navigation Bar */}
      <NavBar onRouteChange={(routeName) => setSelectedRouteName(routeName)} />

      {/* Map */}
      <MapWrapper routeName={selectedRouteName} />

      {/* Overlay Elements */}
      <BusList routeName={selectedRouteName} />
      <MyLocation />
    </div>
  );
}
