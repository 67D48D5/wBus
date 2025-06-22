// src/features/bus/components/BusMarker.tsx

"use client";

import L from "leaflet";
import RotatedMarker from "@map/components/RotatedMarker";

import { useRef, useEffect, useMemo } from "react";
import { Popup } from "react-leaflet";

import { useIcons } from "@map/hooks/useIcons";

import { useBusData } from "@bus/hooks/useBusData";
import { getSnappedPosition } from "@bus/utils/getSnappedPos";

export default function BusMarker({ routeName }: { routeName: string }) {
  const { busIcon } = useIcons();
  const { routeInfo, busList, getDirection, mergedUp, mergedDown } =
    useBusData(routeName);

  const markerRefs = useRef<Record<string, L.Marker>>({});

  // Calculate snapped positions for all buses
  // and create a unique key for each marker based on vehicle number and position
  const snappedList = useMemo(() => {
    return busList.map((bus) => {
      const snapped = getSnappedPosition(
        bus,
        getDirection,
        mergedUp,
        mergedDown
      );
      const key = `${bus.vehicleno}-${snapped.position[0]}-${snapped.position[1]}`;
      return { bus, key, ...snapped };
    });
  }, [busList, getDirection, mergedUp, mergedDown]);

  // Update marker positions when snappedList changes
  // Use slideTo if available, otherwise fallback to setLatLng
  useEffect(() => {
    snappedList.forEach(({ key, position }) => {
      const marker = markerRefs.current[key];
      if (!marker) return;

      const newLatLng = L.latLng(position[0], position[1]);
      if (!marker.getLatLng().equals(newLatLng)) {
        try {
          marker.slideTo?.(newLatLng, { duration: 5000 }) ??
            marker.setLatLng(newLatLng);
        } catch {
          marker.setLatLng(newLatLng); // fallback
        }
      }
    });
  }, [snappedList]);

  if (!routeInfo || snappedList.length === 0) return null;

  return (
    <>
      {snappedList.map(({ bus, key, position, angle, direction }) => (
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
      ))}
    </>
  );
}
