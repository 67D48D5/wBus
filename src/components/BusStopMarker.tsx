// src/components/BusStopMarker.tsx

import { useBusStops } from "@/hooks/useBusStops";
import { busStopIcon } from "@/constants/icons";

import { Marker, Popup } from "react-leaflet";

type Props = {
  routeId: string;
};

export default function BusStopMarker({ routeId }: Props) {
  const stops = useBusStops(routeId);

  return (
    <>
      {stops.map((stop) => (
        <Marker
          key={`${stop.nodeid}-${stop.updowncd}`}
          position={[stop.gpslati, stop.gpslong]}
          icon={busStopIcon}
        >
          <Popup>
            <strong>{stop.nodenm}</strong>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
