// src/features/live/components/BusMarker.tsx

"use client";

import { useMemo } from "react";
import { Popup } from "react-leaflet";
import L from "leaflet";

import RotatedMarker from "@live/components/RotatedMarker";
import { useIcons } from "@live/hooks/useIcons";

import { useBusData } from "@live/hooks/useBusData";
import { getSnappedPosition } from "@live/utils/getSnappedPos";
import { getDirectionIcon } from "@live/utils/directionIcons";

export default function BusMarker({ 
  routeName, 
  onPopupOpen,
  onPopupClose
}: { 
  routeName: string;
  onPopupOpen?: (routeName: string) => void;
  onPopupClose?: () => void;
}) {
  const { busIcon } = useIcons();
  const { routeInfo, busList, getDirection, mergedUp, mergedDown } =
    useBusData(routeName);

  // Create a custom DivIcon with route number overlay
  const createBusIconWithLabel = useMemo(() => {
    return (routeNumber: string) => {
      if (typeof window === "undefined") return busIcon;
      
      // Escape HTML to prevent XSS
      const escapeHtml = (text: string) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };
      
      const escapedRouteNumber = escapeHtml(routeNumber);
      
      return L.divIcon({
        html: `
          <div style="position: relative; width: 29px; height: 43px;">
            <img src="/icons/bus-icon.png" style="width: 29px; height: 43px;" />
            <div style="
              position: absolute;
              top: 8px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(255, 255, 255, 0.95);
              color: #003876;
              font-size: 10px;
              font-weight: bold;
              padding: 1px 3px;
              border-radius: 3px;
              border: 1px solid #003876;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            ">
              ${escapedRouteNumber}
            </div>
          </div>
        `,
        iconSize: [29, 43],
        iconAnchor: [14, 21],
        popupAnchor: [0, -21],
        className: 'bus-marker-with-label'
      });
    };
  }, [busIcon]);

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
          icon={createBusIconWithLabel(bus.routenm)}
          eventHandlers={{
            popupopen: () => {
              if (onPopupOpen) {
                onPopupOpen(routeName);
              }
            },
            popupclose: () => {
              if (onPopupClose) {
                onPopupClose();
              }
            },
          }}
        >
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