// src/features/live/components/BusStopMarker.tsx

"use client";

import { useState, useMemo } from "react";
import { MapPinned } from "lucide-react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";

import { MAP_SETTINGS } from "@core/config/env";

import { useIcons } from "@live/hooks/useIcons";
import { useBusStop } from "@live/hooks/useBusStop";

import { filterStopsByViewport } from "@live/utils/stopFiltering";

import BusStopPopup from "./BusStopPopup";

type Props = {
  routeName: string;
};

export default function BusStopMarker({ routeName }: Props) {
  const stops = useBusStop(routeName);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
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
      if (zoom < MAP_SETTINGS.ZOOM.BUSSTOP_MARKER_MIN) {
        return [];
      }
      return filterStopsByViewport(stops, bounds, zoom);
    },
    [stops, bounds, zoom]
  );

  console.log(`[BusStopMarker] Route: ${routeName}, Zoom: ${zoom}, Total stops: ${stops.length}, Visible: ${visibleStops.length}`);

  return (
    <>
      {visibleStops.map((stop, index) => {
        // Use nodeid + updowncd as primary key, fallback to index for unique identification
        const key = stop.nodeid ? `${stop.nodeid}-${stop.updowncd}` : `stop-${index}`;
        return (
          <Marker
            key={key}
            position={[stop.gpslati, stop.gpslong]}
            icon={busStopIcon}
            eventHandlers={{
              popupopen: () => setActiveStopId(stop.nodeid),
              popupclose: () => setActiveStopId(null),
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
                {activeStopId === stop.nodeid && (
                  <BusStopPopup
                    stopId={stop.nodeid}
                  />
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}