// src/components/BusMarker.tsx

"use client";

import { Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import { fetchBusLocationData } from "@/utils/fetchData";
import L from "leaflet";
import { useBusStops } from "@/hooks/useBusStops";
import { getRepresentativeRouteId } from "@/utils/getRepresentativeRouteId";

const busIconUp = new L.Icon({
  iconUrl: "/images/bus-icon-ur.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const busIconDown = new L.Icon({
  iconUrl: "/images/bus-icon-dl.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

type BusItem = {
  gpslati: number;
  gpslong: number;
  vehicleno: string;
  nodenm: string;
  nodeid: string;
  nodeord: number;
};

type BusMarkerProps = {
  routeId: string;
};

export default function BusMarker({ routeId }: BusMarkerProps) {
  const [busList, setBusList] = useState<BusItem[]>([]);
  const repRouteId = getRepresentativeRouteId(routeId);
  const stops = useBusStops(routeId); // 대표 routeId 기반으로 호출

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
      {busList.map((bus, idx) => {
        // 정류장 목록에서 현재 nodeid와 일치하는 정류장 찾기
        const matchedStop = stops.find((stop) => stop.nodeid === bus.nodeid);
        const updown = matchedStop?.updowncd;

        return (
          <Marker
            key={`${bus.vehicleno}-${idx}`}
            position={[bus.gpslati, bus.gpslong]}
            icon={updown === 1 ? busIconDown : busIconUp}
          >
            <Popup>
              🚌 차량: {bus.vehicleno}
              <br />
              📍 정류장: {bus.nodenm}
              <br />
              {updown === 1 ? "⬇️ 하행" : "⬆️ 상행"}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}