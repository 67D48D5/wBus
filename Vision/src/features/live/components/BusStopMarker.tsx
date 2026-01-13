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
};

const BusStopMarkerItem = memo(({ stop, icon }: BusStopMarkerItemProps) => {
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
      <Popup autoPan={false} minWidth={180} className="custom-bus-stop-popup">
        <div className="min-w-[160px] sm:min-w-[210px]">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 -mx-5 -mt-4 mb-2 sm:mb-3 rounded-t-lg shadow-md">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <MapPinned className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-bold text-sm sm:text-base tracking-tight">{stop.nodenm}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-blue-100 font-medium bg-white/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md inline-block mt-1 sm:mt-1.5">
              {stop.nodeno}
            </span>
          </div>
          {isPopupOpen && (
            <BusStopPopup
              stopId={stop.nodeid}
            />
          )}
        </div>
      </Popup>
    </Marker>
  );
});

BusStopMarkerItem.displayName = "BusStopMarkerItem";

export default function BusStopMarker({ routeName }: { routeName: string }) {
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
      if (zoom < MAP_SETTINGS.ZOOM.BUS_STOP_DISPLAY) {
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
          />
        );
      })}
    </>
  );
}
