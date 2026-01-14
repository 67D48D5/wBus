// src/features/live/components/BusStopMarker.tsx

"use client";

import { MapPinned } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";

import { APP_CONFIG, MAP_SETTINGS } from "@core/config/env";

import BusStopPopup from "@live/components/BusStopPopup";

import { useIcons } from "@live/hooks/useIcons";
import { useBusStop } from "@live/hooks/useBusStop";

import { filterStopsByViewport } from "@live/utils/stopFiltering";

import type { BusStop } from "@core/domain/live";
import type { Icon } from "leaflet";

type BusStopMarkerItemProps = {
  stop: BusStop;
  icon: Icon;
  onRouteChange?: (routeName: string) => void;
};

const BusStopMarkerItem = memo(({ stop, icon, onRouteChange }: BusStopMarkerItemProps) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const handlePopupOpen = useCallback(() => {
    setIsPopupOpen(true);
  }, []);
  const handlePopupClose = useCallback(() => {
    setIsPopupOpen(false);
  }, []);

  return (
    <Marker
      position={[stop.gpslati, stop.gpslong]}
      icon={icon}
      eventHandlers={{
        popupopen: handlePopupOpen,
        popupclose: handlePopupClose,
      }}
    >
      <Popup autoPan={false} minWidth={200} className="custom-bus-stop-popup">
        <div className="min-w-[200px] sm:min-w-[250px] flex flex-col">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPinned className="w-5 h-5 flex-shrink-0 text-white/90" />
                <span className="font-bold text-sm sm:text-base tracking-tight leading-snug">
                  {stop.nodenm}
                </span>
              </div>
            </div>
            {/* Node Number Badge */}
            <div className="mt-2 flex">
              <span className="text-[10px] sm:text-xs font-bold text-blue-700 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-blue-200/50">
                {stop.nodeno}
              </span>
            </div>
          </div>

          {/* Body Section (Arrival Info) */}
          <div className="bg-white min-h-[60px]">
            {isPopupOpen && (
              <BusStopPopup
                stopId={stop.nodeid}
                onRouteChange={onRouteChange}
              />
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

BusStopMarkerItem.displayName = "BusStopMarkerItem";

export default function BusStopMarker({
  routeName,
  onRouteChange
}: {
  routeName: string;
  onRouteChange?: (routeName: string) => void;
}) {
  const stops = useBusStop(routeName);
  const { busStopIcon } = useIcons();

  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [bounds, setBounds] = useState(map.getBounds());

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    },
    moveend: () => {
      setBounds(map.getBounds());
    },
  });

  // Filter stops by viewport and zoom level for performance
  const visibleStops = useMemo(
    () => {
      if (zoom < MAP_SETTINGS.ZOOM.BUS_STOP_VISIBLE) {
        return [];
      }
      return filterStopsByViewport(stops, bounds, zoom);
    },
    [stops, bounds, zoom]
  );

  if (APP_CONFIG.IS_DEV) {
    console.log(`[BusStopMarker] Route: ${routeName}, Zoom: ${zoom}, Total stops: ${stops.length}, Visible: ${visibleStops.length}`);
  }

  if (!busStopIcon) return null;

  return (
    <>
      {visibleStops.map((stop, index) => {
        // Use nodeid + updowncd as primary key, fallback to index for unique identification
        const key = stop.nodeid ? `${stop.nodeid}-${stop.updowncd}` : `stop-${index}`;
        return (
          <BusStopMarkerItem
            key={key}
            stop={stop}
            icon={busStopIcon}
            onRouteChange={onRouteChange}
          />
        );
      })}
    </>
  );
}
