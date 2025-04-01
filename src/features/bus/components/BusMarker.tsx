// src/components/BusMarker.tsx

"use client";

import L from "leaflet";
import RotatedMarker from "@map/components/RotatedMarker";

import { useRef, useEffect } from "react";
import { Popup } from "react-leaflet";

import { useIcons } from "@map/hooks/useIcons";
import { useBusData } from "@bus/hooks/useBusData";
import { getSnappedPosition } from "@bus/utils/getSnappedPosition";

export default function BusMarker({ routeName }: { routeName: string }) {
  const { busIcon } = useIcons();
  const { routeInfo, busList, getDirection, mergedUp, mergedDown } =
    useBusData(routeName);

  const markerRefs = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    busList.forEach((bus) => {
      const marker = markerRefs.current[bus.vehicleno];
      if (!marker) return;

      // getSnappedPosition 내부에서 getDirection 호출하므로, getDirection 함수를 그대로 전달
      const { position } = getSnappedPosition(
        bus,
        getDirection,
        mergedUp,
        mergedDown
      );
      const newLatLng = L.latLng(position[0], position[1]);

      if (!marker.getLatLng().equals(newLatLng)) {
        marker.slideTo?.(newLatLng, { duration: 5000 }) ??
          marker.setLatLng(newLatLng);
      }
    });
  }, [busList, getDirection, mergedUp, mergedDown]);

  if (!routeInfo || busList.length === 0) return null;

  return (
    <>
      {busList.map((bus) => {
        const key = bus.vehicleno;
        const { position, angle, direction } = getSnappedPosition(
          bus,
          getDirection,
          mergedUp,
          mergedDown
        );

        return (
          <RotatedMarker
            key={key}
            position={position}
            rotationAngle={angle % 360}
            icon={busIcon}
            ref={(marker: L.Marker | null) => {
              if (marker) {
                markerRefs.current[key] = marker;
              }
            }}
          >
            <Popup autoPan={false}>
              <div className="font-bold mb-1">
                {direction === 1 ? "⬆️" : "⬇️"} {bus.routenm}번
              </div>
              {bus.vehicleno}, {bus.nodenm}
            </Popup>
          </RotatedMarker>
        );
      })}
    </>
  );
}
