// src/features/live/components/BusMarker.tsx

"use client";

import L from "leaflet";

import { Popup } from "react-leaflet";
import { useMemo, useEffect } from "react";

import { MAP_SETTINGS } from "@core/config/env";
import { UI_TEXT } from "@core/config/locale";

import { useIcons } from "@live/hooks/useIcons";
import { useBusData } from "@live/hooks/useBusData";

import { getSnappedPosition } from "@live/utils/getSnappedPos";
import { getDirectionIcon } from "@live/utils/directionIcons";

import { AnimatedBusMarker } from "@live/components/MapAnimatedBusMarker";

import type { LatLngTuple } from "leaflet";

const BUS_LABEL_STYLE = `
@keyframes busRouteMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.bus-marker-with-label .bus-route-text-animate {
  display: inline-block;
  animation: busRouteMarquee 3s linear infinite;
}
.bus-marker-with-label .bus-route-text-container:hover .bus-route-text-animate {
  animation-play-state: paused;
}
`;
const BUS_MARKER_SETTINGS = MAP_SETTINGS.MARKERS.BUS;

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById(BUS_MARKER_SETTINGS.LABEL_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = BUS_MARKER_SETTINGS.LABEL_STYLE_ID;
    style.textContent = BUS_LABEL_STYLE;
    document.head.appendChild(style);
  }, []);

  const iconCache = useMemo(() => new Map<string, L.DivIcon>(), [busIcon]);

  const createBusIconWithLabel = useMemo(() => {
    const escapeHtml = (text: string | number | null | undefined) =>
      String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    return (routeNumber: string) => {
      if (typeof window === "undefined") return busIcon ?? null;
      const cached = iconCache.get(routeNumber);
      if (cached) return cached;
      if (!busIcon) return null;

      const escapedRouteNumber = escapeHtml(routeNumber);
      const needsMarquee = routeNumber.length > BUS_MARKER_SETTINGS.MARQUEE_THRESHOLD;
      const displayText = needsMarquee
        ? `${escapedRouteNumber} ${escapedRouteNumber}`
        : escapedRouteNumber;
      const animationClass = needsMarquee ? "bus-route-text-animate" : "";
      const [iconWidth, iconHeight] = BUS_MARKER_SETTINGS.ICON_SIZE;

      const icon = L.divIcon({
        html: `
          <div style="position: relative; width: ${iconWidth}px; height: ${iconHeight}px; filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.4));">
            <img src="/icons/bus-icon.png" style="width: ${iconWidth}px; height: ${iconHeight}px; transition: transform 0.3s ease;" />
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
        iconSize: BUS_MARKER_SETTINGS.ICON_SIZE,
        iconAnchor: BUS_MARKER_SETTINGS.ICON_ANCHOR,
        popupAnchor: BUS_MARKER_SETTINGS.POPUP_ANCHOR,
        className: "bus-marker-with-label"
      });

      iconCache.set(routeNumber, icon);
      return icon;
    };
  }, [busIcon, iconCache]);

  const snappedList = useMemo(() => {
    if (!routeInfo || busList.length === 0) return [];
    return busList.map((bus) => {
      const snapped = getSnappedPosition(
        bus,
        getDirection,
        mergedUp,
        mergedDown
      );
      const key = `${routeName}-${bus.vehicleno}`;
      const polyline: LatLngTuple[] = snapped.direction === 1 ? mergedUp : mergedDown;
      return { bus, key, polyline, ...snapped };
    });
  }, [routeInfo, busList, getDirection, mergedUp, mergedDown, routeName]);

  if (!routeInfo || snappedList.length === 0) return null;

  return (
    <>
      {snappedList.map(({ bus, key, position, angle, direction, polyline }) => {
        const icon = createBusIconWithLabel(bus.routenm);
        if (!icon) return null;
        const DirectionIcon = getDirectionIcon(direction);
        const stopName = bus.nodenm || "";

        return (
          <AnimatedBusMarker
            key={key}
            position={position}
            rotationAngle={angle % 360}
            icon={icon}
            polyline={polyline}
            animationDuration={MAP_SETTINGS.ANIMATION.BUS_MOVE_MS}
            eventHandlers={{
              popupopen: () => {
                if (onPopupOpen) onPopupOpen(routeName);
              },
              popupclose: () => {
                if (onPopupClose) onPopupClose();
              },
            }}
          >
            <Popup autoPan={false} className="custom-bus-popup">
              <div className="min-w-[150px] sm:min-w-[200px] flex flex-col">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <DirectionIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" aria-hidden="true" />
                    <span className="font-bold text-sm sm:text-base tracking-tight leading-none">
                      {UI_TEXT.BUS_LIST.TITLE_ROUTE(bus.routenm)}
                    </span>
                  </div>
                </div>

                {/* Info Body Section */}
                <div className="bg-white px-4 py-3 space-y-2.5">
                  {/* Vehicle Number Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                      {UI_TEXT.BUS_ITEM.VEHICLE_NUM}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {bus.vehicleno}
                    </span>
                  </div>

                  {/* Location Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500">
                      {UI_TEXT.BUS_ITEM.CURRENT_LOC}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-900 font-medium leading-tight break-keep">
                      {stopName}
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
