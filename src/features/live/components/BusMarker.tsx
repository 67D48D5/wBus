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
          <div style="position: relative; width: 29px; height: 43px; filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.4));">
            <img src="/icons/bus-icon.png" style="width: 29px; height: 43px; transition: transform 0.3s ease;" />
            <div style="
              position: absolute;
              top: 7px;
              left: 50%;
              transform: translateX(-50%);
              background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
              color: white;
              font-size: 10px;
              font-weight: bold;
              padding: 2px 5px;
              border-radius: 6px;
              border: 1.5px solid white;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
              letter-spacing: 0.3px;
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
          <Popup autoPan={false} className="custom-bus-popup">
            <div className="min-w-[180px]">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-2.5 -mx-5 -mt-4 mb-3 rounded-t-lg shadow-md">
                <div className="flex items-center gap-2">
                  {(() => {
                    const DirectionIcon = getDirectionIcon(direction);
                    return <DirectionIcon className="w-5 h-5" />;
                  })()}
                  <span className="font-bold text-base tracking-tight">
                    {bus.routenm}번 버스
                  </span>
                </div>
              </div>
              <div className="space-y-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 w-16">차량번호</span>
                  <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-md">
                    {bus.vehicleno}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 w-16 mt-1">현재위치</span>
                  <span className="text-sm text-gray-700 font-medium flex-1">
                    {bus.nodenm}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </RotatedMarker>
      ))}
    </>
  );
}