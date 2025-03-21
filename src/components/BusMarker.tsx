// src/components/BusMarker.tsx

"use client";

import {
  fetchBusLocationData,
  fetchBusStopLocationData,
} from "@/utils/fetchData";
import { getRepresentativeRouteId } from "@/utils/getRepresentativeRouteId";
import { busIconUp, busIconDown } from "@/constants/icons";

import { Marker, Popup } from "react-leaflet";
import { useEffect, useRef, useState } from "react";

type BusItem = {
  gpslati: number;
  gpslong: number;
  vehicleno: string;
  nodenm: string;
  nodeid: string;
  nodeord: number;
};

type BusStop = {
  gpslati: number;
  gpslong: number;
  nodeid: string;
  nodenm: string;
  nodeord: number;
  updowncd: number;
};

type BusMarkerProps = {
  routeId: string;
};

const stopsCache: Record<string, BusStop[]> = {};

export default function BusMarker({ routeId }: BusMarkerProps) {
  const [busList, setBusList] = useState<BusItem[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const repRouteId = getRepresentativeRouteId(routeId);

  useEffect(() => {
    const loadStops = async () => {
      if (!repRouteId) return;
      if (stopsCache[repRouteId]) {
        setStops(stopsCache[repRouteId]);
        return;
      }

      const fetched = await fetchBusStopLocationData(repRouteId);
      stopsCache[repRouteId] = fetched;
      setStops(fetched);
    };

    loadStops();
  }, [repRouteId]);

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

        setBusList(results.flat());
      } catch (error) {
        console.error("❌ Failed to fetch multiple buses:", error);
      }
    };

    fetchAllBuses();
    const interval = setInterval(fetchAllBuses, 10000);
    return () => clearInterval(interval);
  }, [routeId]);

  if (!repRouteId) return null;

  return (
    <>
      {busList.map((bus, idx) => {
        const matchedStop = stops.find((stop) => stop.nodeid === bus.nodeid);
        if (!matchedStop) {
          console.warn("⚠️ 정류장 매칭 실패:", bus.nodeid);
        }
        const updown = matchedStop?.updowncd ?? 0;

        return (
          <Marker
            key={`${bus.vehicleno}-${idx}`}
            position={[bus.gpslati, bus.gpslong]}
            icon={updown === 1 ? busIconDown : busIconUp}
          >
            <Popup>
              <div className="font-bold mb-1">
                {updown === 1 ? "⬆️" : "⬇️"} {routeId}번
              </div>
              {bus.vehicleno}, {bus.nodenm}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
