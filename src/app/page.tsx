// src/app/page.tsx

"use client";

import NavBar from "@/components/NavBar";
import MapWrapper from "@/components/MapWrapper";
import BusSchedule from "@/components/BusSchedule";
import BusList from "@/components/BusList";
import { startBusPolling } from "@/hooks/useBusData";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Disable SSR for MyLocation component
const MyLocation = dynamic(() => import("@/components/MyLocation"), {
  ssr: false,
});

export default function Home() {
  const [selectedRouteName, setSelectedRouteName] = useState("30");

  useEffect(() => {
    const stop = startBusPolling(selectedRouteName);
    return stop;
  }, [selectedRouteName]);

  return (
    <div className="w-full h-screen relative">
      <MapWrapper routeName={selectedRouteName} />
      <NavBar onRouteChange={(routeName) => setSelectedRouteName(routeName)} />
      <BusSchedule routeName={selectedRouteName} />
      <BusList routeName={selectedRouteName} />
      <MyLocation />
    </div>
  );
}
