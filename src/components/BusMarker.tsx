// src/components/BusMarker.tsx

"use client";

import { Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import { fetchBusLocationData } from "@/utils/fetchData";
import L from "leaflet";

const busIcon = new L.Icon({
  iconUrl: "/images/bus-icon-ur.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

type BusItem = {
  gpslati: number;
  gpslong: number;
  vehicleno: string;
  nodenm: string;
};

type BusMarkerProps = {
  routeId: string;
};

export default function BusMarker({ routeId }: BusMarkerProps) {
  const [busList, setBusList] = useState<BusItem[]>([]);

  useEffect(() => {
    const fetchAllBuses = async () => {
      try {
        const routeIdsRes = await fetch("/routeIds.json");
        const routeIdsData = await routeIdsRes.json();
        const vehicleCodes: string[] = routeIdsData[routeId];

        if (!vehicleCodes || vehicleCodes.length === 0) return;

        const results = await Promise.all(
          vehicleCodes.map((id) => fetchBusLocationData(id))
        );

        const merged = results.flat();
        setBusList(merged);
      } catch (error) {
        console.error("❌ Failed to fetch multiple buses:", error);
      }
    };

    fetchAllBuses();
    const interval = setInterval(fetchAllBuses, 10000);
    return () => clearInterval(interval);
  }, [routeId]);

  return (
    <>
      {busList.map((bus, idx) => (
        <Marker key={idx} position={[bus.gpslati, bus.gpslong]} icon={busIcon}>
          <Popup>
            🚌 차량: {bus.vehicleno}
            <br />
            📍 정류장: {bus.nodenm}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
