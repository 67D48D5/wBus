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
          key={`${stop.nodeid}-${stop.updowncd}`} // 👈 이제 고유함 보장
          position={[stop.gpslati, stop.gpslong]}
          icon={busStopIcon}
        >
          <Popup>{stop.nodenm}</Popup>
        </Marker>
      ))}
    </>
  );
}
