// src/features/live/components/BusStopMarker.tsx

"use client";

import { useState } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { MapPinned } from "lucide-react";

import { BUSSTOP_MARKER_MIN_ZOOM } from "@core/constants/env";

import { useIcons } from "@live/hooks/useIcons";
import { useBusStop } from "@live/hooks/useBusStop";

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

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });

  // Render nothing if the zoom level is below the threshold
  if (zoom < BUSSTOP_MARKER_MIN_ZOOM) {
    return null;
  }

  return (
    <>
      {stops.map((stop) => {
        return (
          <Marker
            key={`${stop.nodeid}-${stop.updowncd}`}
            position={[stop.gpslati, stop.gpslong]}
            icon={busStopIcon}
            eventHandlers={{
              popupopen: () => setActiveStopId(stop.nodeid),
              popupclose: () => setActiveStopId(null),
            }}
          >
            <Popup autoPan={false} minWidth={210} className="custom-bus-stop-popup">
              <div className="min-w-[210px]">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-2.5 -mx-5 -mt-4 mb-3 rounded-t-lg shadow-md">
                  <div className="flex items-center gap-2">
                    <MapPinned className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-base tracking-tight">{stop.nodenm}</span>
                  </div>
                  <span className="text-xs text-blue-100 font-medium bg-white/20 px-2 py-1 rounded-md inline-block mt-1.5">
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