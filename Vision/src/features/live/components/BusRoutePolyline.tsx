// src/features/live/components/BusRoutePolyline.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Polyline } from "react-leaflet";

import { getRouteInfo } from "@live/api/getRouteMap";

import { usePolyline } from "@live/hooks/usePolyline";
import { useBusLocationData } from "@live/hooks/useBusLocation";

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
  const { data: busList } = useBusLocationData(routeName);
  const [fallbackRouteId, setFallbackRouteId] = useState<string | null>(null);

  // Preload representative route ID for the route in case no live bus data is available
  useEffect(() => {
    let isMounted = true;

    getRouteInfo(routeName)
      .then((info) => {
        if (!isMounted) return;
        setFallbackRouteId(info?.representativeRouteId ?? null);
      })
      .catch((error) => console.error(error));

    return () => {
      isMounted = false;
    };
  }, [routeName]);

  const activeRouteId = useMemo(() => {
    const liveRouteId = busList.find((bus) => bus.routeid)?.routeid ?? null;
    return liveRouteId ?? fallbackRouteId;
  }, [busList, fallbackRouteId]);

  const { upPolyline, downPolyline } = usePolyline(routeName, activeRouteId);

  // If there are no buses running, set inactive state
  const isInactive = busList.length === 0;

  const commonPathOptions = useMemo(() => ({
    weight: 5,
    dashArray: isInactive ? "8, 4" : undefined,
    lineCap: "round" as const,
    lineJoin: "round" as const,
  }), [isInactive]);

  return (
    <>
      {upPolyline.map((coords, idx) => (
        <Polyline
          key={`up-${idx}`}
          positions={coords}
          pathOptions={{
            ...commonPathOptions,
            color: "#3b82f6",
            opacity: computeOpacity(idx, upPolyline.length, isInactive),
          }}
        />
      ))}

      {downPolyline.map((coords, idx) => (
        <Polyline
          key={`down-${idx}`}
          positions={coords}
          pathOptions={{
            ...commonPathOptions,
            color: "#ef4444",
            opacity: computeOpacity(idx, downPolyline.length, isInactive),
          }}
        />
      ))}
    </>
  );
}
