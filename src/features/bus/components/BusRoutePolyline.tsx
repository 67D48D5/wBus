// src/features/bus/components/BusRoutePolyline.tsx

"use client";

import { Polyline } from "react-leaflet";

import { usePolyline } from "@bus/hooks/usePolyline";
import { useBusLocationData } from "@bus/hooks/useBusLocation";

type Props = {
  routeName: string;
};

/**
 * Calculate the opacity for each polyline segment based on its index.
 * If no buses are running, it returns a lower opacity.
 *
 * @param idx Current polyline index
 * @param total Total number of polylines
 * @param isInactive No buses are running
 * @returns Computed opacity value
 */
function computeOpacity(
  idx: number,
  total: number,
  isInactive: boolean
): number {
  const dynamicOpacity = Math.max(1 - idx / total, 0.2);
  return isInactive ? 0.3 : dynamicOpacity;
}

export default function BusRoutePolyline({ routeName }: Props) {
  const { upPolyline, downPolyline } = usePolyline(routeName);
  const { data: busList } = useBusLocationData(routeName);

  // If there are no buses running, set inactive state
  const isInactive = busList.length === 0;

  return (
    <>
      {upPolyline.map((coords, idx) => {
        const opacity = computeOpacity(idx, upPolyline.length, isInactive);
        return (
          <Polyline
            key={`up-${idx}`}
            positions={coords}
            pathOptions={{
              color: "blue",
              weight: 4,
              dashArray: isInactive ? "4" : undefined,
              opacity,
            }}
          />
        );
      })}

      {downPolyline.map((coords, idx) => {
        const opacity = computeOpacity(idx, downPolyline.length, isInactive);
        return (
          <Polyline
            key={`down-${idx}`}
            positions={coords}
            pathOptions={{
              color: "red",
              weight: 4,
              dashArray: isInactive ? "4" : undefined,
              opacity,
            }}
          />
        );
      })}
    </>
  );
}
