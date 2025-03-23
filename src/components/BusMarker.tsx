// src/components/BusMarker.tsx

"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { useBusData } from "@/hooks/useBusData";
import { getRouteInfo } from "@/utils/getRouteInfo";
import { busIconUp, busIconDown } from "@/constants/icons";
import { useBusDirection } from "@/hooks/useBusDirection";

import type { RouteInfo } from "@/types/data";

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
  const getDirection = useBusDirection(routeName);

  if (!routeInfo) return null;
  if (busList.length === 0) return null;

  return (
    <>
      {busList.map((bus) => {
        const updown = getDirection(bus.nodeid, bus.nodeord);

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
