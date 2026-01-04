// src/features/live/components/BusMarker.tsx

"use client";

import { useMemo } from "react";
import { Popup } from "react-leaflet";
import L from "leaflet";

import { BUS_ANIMATION_DURATION } from "@/core/constants/env";
import { UI_TEXT } from "@core/constants/locale";

import { useIcons } from "@live/hooks/useIcons";
import { useBusData } from "@live/hooks/useBusData";

import { getSnappedPosition } from "@live/utils/getSnappedPos";
import { getDirectionIcon } from "@live/utils/directionIcons";

import { AnimatedBusMarker } from "@live/components/AnimatedBusMarker";

import type { LatLngTuple } from "leaflet";

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

      // Only apply marquee for route numbers longer than 3 characters
      const needsMarquee = routeNumber.length > 3;
      const displayText = needsMarquee ? `${escapedRouteNumber} ${escapedRouteNumber}` : escapedRouteNumber;
      const animationClass = needsMarquee ? 'bus-route-text-animate' : '';

      return L.divIcon({
        html: `
          <style>
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .bus-route-text-animate {
              display: inline-block;
              animation: marquee 3s linear infinite;
            }
            .bus-route-text-container:hover .bus-route-text-animate {
              animation-play-state: paused;
            }
          </style>
          <div style="position: relative; width: 29px; height: 43px; filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.4));">
            <img src="/icons/bus-icon.png" style="width: 29px; height: 43px; transition: transform 0.3s ease;" />
            <div class="bus-route-text-container" style="
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
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
              letter-spacing: 0.3px;
              max-width: 24px;
              overflow: hidden;
              white-space: nowrap;
            ">
              <span class="${animationClass}">${displayText}</span>
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
      // Determine which polyline to use for animation
      const polyline: LatLngTuple[] = snapped.direction === 1 ? mergedUp : mergedDown;
      return { bus, key, polyline, ...snapped };
    });
  }, [busList, getDirection, mergedUp, mergedDown]);

  if (!routeInfo || snappedList.length === 0) return null;

  return (
    <>
      {snappedList.map(({ bus, key, position, angle, direction, polyline }) => {
        const icon = createBusIconWithLabel(bus.routenm);
        if (!icon) return null;
        return (
          <AnimatedBusMarker
            key={key}
            position={position}
            rotationAngle={angle % 360}
            icon={icon}
            polyline={polyline}
            animationDuration={BUS_ANIMATION_DURATION}
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
              <div className="min-w-[140px] sm:min-w-[180px]">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 -mx-5 -mt-4 mb-2 sm:mb-3 rounded-t-lg shadow-md">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {(() => {
                      const DirectionIcon = getDirectionIcon(direction);
                      return <DirectionIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
                    })()}
                    <span className="font-bold text-sm sm:text-base tracking-tight">
                      {UI_TEXT.BUS_ROUTE_LABEL(bus.routenm)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2 px-0.5 sm:px-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 w-14 sm:w-16">{UI_TEXT.VEHICLE_NUMBER}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md">
                      {bus.vehicleno}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 w-14 sm:w-16 mt-0.5 sm:mt-1">{UI_TEXT.CURRENT_LOCATION}</span>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium flex-1">
                      {bus.nodenm}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </AnimatedBusMarker>
        );
      })}
    </>
  );
}