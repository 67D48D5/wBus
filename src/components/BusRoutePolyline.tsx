// src/components/BusRoutePolyline.tsx

"use client";

import { Polyline } from "react-leaflet";
import { usePolyline } from "@/hooks/usePolyline";

type Props = {
  routeName: string;
};

export default function BusRoutePolyline({ routeName }: Props) {
  const { upPolyline, downPolyline } = usePolyline(routeName);

  return (
    <>
      {upPolyline.map((coords, idx) => (
        <Polyline
          key={`up-${idx}`}
          positions={coords}
          pathOptions={{ color: "blue", weight: 4 }}
        />
      ))}

      {downPolyline.map((coords, idx) => (
        <Polyline
          key={`down-${idx}`}
          positions={coords}
          pathOptions={{ color: "red", weight: 4 }}
        />
      ))}
    </>
  );
}
