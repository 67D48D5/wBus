// src/features/live/components/BusStopMarker.tsx

"use client";

import { useState } from "react";
import { Marker, Popup, useBus, useBusEvents } from "react-leaflet";

import { BUSSTOP_MARKER_MIN_ZOOM } from "@core/constants/env";

import { useIcons } from "@live/hooks/useIcons";
import { useBusStop } from "@live/hooks/useBusStop";
import { useBusDirection } from "@live/hooks/useBusDirection";

import { getDirectionIcon } from "@live/utils/directionIcons";

import BusStopPopup from "./BusStopPopup";

type Props = {
  routeName: string;
};

export default function BusStopMarker({ routeName }: Props) {
  const stops = useBusStop(routeName);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const { busStopIcon } = useIcons();
  const getDirection = useBusDirection(routeName);

  const map = useBus();
  const [zoom, setZoom] = useState(map.getZoom());

  useBusEvents({
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
        const directionCode = getDirection(stop.nodeid, stop.nodeord);
        const directionLabel = getDirectionIcon(directionCode);

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
            <Popup autoPan={false} minWidth={210}>
              <div className="max-h-[280px] w-[210px] overflow-y-auto">
                <div className="font-bold mb-1">
                  🚏 {stop.nodenm}{" "}
                  <span className="text-xs text-gray-500">{stop.nodeno}</span>
                </div>
                {activeStopId === stop.nodeid && (
                  <BusStopPopup
                    routeName={routeName}
                    stopId={stop.nodeid}
                    directionLabel={directionLabel}
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