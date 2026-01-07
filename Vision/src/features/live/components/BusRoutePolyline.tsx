// src/features/live/components/BusRoutePolyline.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Polyline } from "react-leaflet";

import { getRouteInfo } from "@live/api/getRouteMap";

import { useMultiPolyline } from "@live/hooks/useMultiPolyline";
import { useBusLocationData } from "@live/hooks/useBusLocation";

type Props = {
  routeName: string;
};

/**
 * Calculate the opacity for each polyline segment based on its index.
 *
 * @param idx Current polyline index
 * @param total Total number of polylines
 * @returns Computed opacity value
 */
function computeOpacity(idx: number, total: number): number {
  return Math.max(1 - idx / total, 0.2);
}

export default function BusRoutePolyline({ routeName }: Props) {
  const { data: busList } = useBusLocationData(routeName);
  const [routeIds, setRouteIds] = useState<string[]>([]);

  // Load all routeIds for this route
  useEffect(() => {
    let isMounted = true;

    getRouteInfo(routeName)
      .then((info) => {
        if (!isMounted) return;
        setRouteIds(info?.vehicleRouteIds ?? []);
      })
      .catch((error) => console.error(error));

    return () => {
      isMounted = false;
    };
  }, [routeName]);

  // Determine active routeId from live bus data, with fallback to first available routeId
  const activeRouteId = useMemo(() => {
    // Prefer live bus data
    const liveRouteId = busList.find((bus) => bus.routeid)?.routeid ?? null;
    if (liveRouteId) return liveRouteId;

    // Fallback to first routeId if no buses are running
    return routeIds.length > 0 ? routeIds[0] : null;
  }, [busList, routeIds]);

  const {
    activeUpSegments,
    inactiveUpSegments,
    activeDownSegments,
    inactiveDownSegments,
  } = useMultiPolyline(routeName, routeIds, activeRouteId);

  // If there are no buses running, set inactive state
  const isInactive = busList.length === 0;

  const activePathOptions = useMemo(
    () => ({
      weight: 6,
      dashArray: isInactive ? "8, 4" : undefined,
      lineCap: "round" as const,
      lineJoin: "round" as const,
    }),
    [isInactive]
  );

  const inactivePathOptions = useMemo(
    () => ({
      weight: 3,
      dashArray: "6, 6",
      lineCap: "round" as const,
      lineJoin: "round" as const,
    }),
    []
  );

  return (
    <>
      {/* Inactive (alternative) routes - lighter and dashed */}
      {inactiveUpSegments.map((segment, idx) => (
        <Polyline
          key={`inactive-up-${segment.routeIds.join("-")}-${idx}`}
          positions={segment.coords}
          pathOptions={{
            ...inactivePathOptions,
            color: "#93c5fd",
            opacity: 0.25,
          }}
        />
      ))}

      {inactiveDownSegments.map((segment, idx) => (
        <Polyline
          key={`inactive-down-${segment.routeIds.join("-")}-${idx}`}
          positions={segment.coords}
          pathOptions={{
            ...inactivePathOptions,
            color: "#fca5a5",
            opacity: 0.25,
          }}
        />
      ))}

      {/* Active route - prominent and solid */}
      {activeUpSegments.map((segment, idx) => (
        <Polyline
          key={`active-up-${segment.routeIds.join("-")}-${idx}`}
          positions={segment.coords}
          pathOptions={{
            ...activePathOptions,
            color: "#3b82f6",
            opacity: computeOpacity(idx, activeUpSegments.length),
          }}
        />
      ))}

      {activeDownSegments.map((segment, idx) => (
        <Polyline
          key={`active-down-${segment.routeIds.join("-")}-${idx}`}
          positions={segment.coords}
          pathOptions={{
            ...activePathOptions,
            color: "#ef4444",
            opacity: computeOpacity(idx, activeDownSegments.length),
          }}
        />
      ))}
    </>
  );
}