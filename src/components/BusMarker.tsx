// src/components/BusMarker.tsx

"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { useBusStops } from "@/hooks/useBusStops";
import { useBusData } from "@/hooks/useBusData";
import { busIconUp, busIconDown } from "@/constants/icons";
import { getRouteInfo } from "@/utils/getRouteInfo";
import type { RouteInfo } from "@/types/route";

type BusMarkerProps = {
  routeName: string;
};

export default function BusMarker({ routeName }: BusMarkerProps) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    const load = async () => {
      const info = await getRouteInfo(routeName);
      setRouteInfo(info);
    };
    load();
  }, [routeName]);

  const { data: busList, error } = useBusData(routeName);
  const stops = useBusStops(routeName);

  if (!routeInfo) return null;
  if (busList.length === 0) return null;

  return (
    <>
      {busList.map((bus) => {
        const matchedStop = stops.find((stop) => stop.nodeid === bus.nodeid);
        const updown = matchedStop?.updowncd ?? 0;

        return (
          <Marker
            key={`${bus.vehicleno}-${bus.gpslati}-${bus.gpslong}`}
            position={[bus.gpslati, bus.gpslong]}
            icon={updown === 1 ? busIconDown : busIconUp}
          >
            <Popup>
              <div className="font-bold mb-1">
                {updown === 1 ? "⬆️" : "⬇️"} {routeName}번
              </div>
              {bus.vehicleno}, {bus.nodenm}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
