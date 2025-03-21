// src/app/page.tsx

"use client";

import NavBar from "@/components/NavBar";
import MapWrapper from "@/components/MapWrapper";
import BusSchedule from "@/components/BusSchedule";
import BusList from "@/components/BusList";

import { startBusPolling } from "@/hooks/useBusData";

import { useEffect, useState } from "react";

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState("30");

  useEffect(() => {
    const stop = startBusPolling(selectedRoute);
    return stop;
  }, [selectedRoute]);
  
  return (
    <div className="w-full h-screen relative">
      <NavBar onRouteChange={(routeId) => setSelectedRoute(routeId)} />
      <BusSchedule routeId={selectedRoute} />
      <BusList routeId={selectedRoute} />
      <MapWrapper routeId={selectedRoute} />
    </div>
  );
}
