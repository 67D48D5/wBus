// src/components/BusMarker.tsx

"use client";

import { Marker, Popup } from "react-leaflet";
import { getRepresentativeRouteId } from "@/utils/getRepresentativeRouteId";
import { useBusStops } from "@/hooks/useBusStops";
import { useBusData } from "@/hooks/useBusData";
import { busIconUp, busIconDown } from "@/constants/icons";

type BusMarkerProps = {
  routeId: string;
};

export default function BusMarker({ routeId }: BusMarkerProps) {
  const repRouteId = getRepresentativeRouteId(routeId);
  const stops = useBusStops(repRouteId ?? "");
  const busList = useBusData(routeId); // 공통 훅 사용

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
