// src/features/bus/components/BusMarker.tsx

"use client";

import { useMemo } from "react";
import { Popup, Tooltip } from "react-leaflet";

import RotatedMarker from "@map/components/RotatedMarker";
import { useIcons } from "@map/hooks/useIcons";

import { useBusData } from "@bus/hooks/useBusData";
import { getSnappedPosition } from "@bus/utils/getSnappedPos";
import { getDirectionIcon } from "@shared/utils/directionIcons";

export default function BusMarker({ 
  routeName, 
  onRouteClick 
}: { 
  routeName: string;
  onRouteClick?: (routeName: string) => void;
}) {
  const { busIcon } = useIcons();
  const { routeInfo, busList, getDirection, mergedUp, mergedDown } =
    useBusData(routeName);

  // Calculate snapped positions for all buses
  const snappedList = useMemo(() => {
    return busList.map((bus) => {
      const snapped = getSnappedPosition(
        bus,
        getDirection,
        mergedUp,
        mergedDown
      );
      // Use only vehicle number as a unique key
      const key = bus.vehicleno;
      return { bus, key, ...snapped };
    });
  }, [busList, getDirection, mergedUp, mergedDown]);

  if (!routeInfo || snappedList.length === 0) return null;

  return (
    <>
      {snappedList.map(({ bus, key, position, angle, direction }) => (
        <RotatedMarker
          key={key}
          position={position}
          rotationAngle={angle % 360}
          icon={busIcon}
          eventHandlers={{
            click: () => {
              if (onRouteClick) {
                onRouteClick(routeName);
              }
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
            <div className="text-center font-semibold text-sm">
              {bus.routenm}번
            </div>
          </Tooltip>
          <Popup autoPan={false}>
            <div className="font-bold mb-1">
              {getDirectionIcon(direction)} {bus.routenm}번
            </div>
            {bus.vehicleno}, {bus.nodenm}
          </Popup>
        </RotatedMarker>
      ))}
    </>
  );
}