// src/features/live/components/BusRoutePolyline.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Polyline } from "react-leaflet";

import { getRouteInfo } from "@live/api/getRouteMap";

import { useMultiPolyline } from "@live/hooks/useMultiPolyline";
import { useBusLocationData } from "@live/hooks/useBusLocation";
import { useRoutePreference } from "@live/hooks/useRoutePreference";

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

  // Get live routeId from running buses
  const liveRouteId = useMemo(() => {
    return busList.find((bus) => bus.routeid)?.routeid ?? null;
  }, [busList]);

  // Use preference hook to manage user's selected routeId with localStorage
  const {
    selectedRouteId,
    updateSelectedRouteId,
    availableRouteIds,
  } = useRoutePreference(routeName, routeIds, liveRouteId);

  const {
    activeUpSegments,
    inactiveUpSegments,
    activeDownSegments,
    inactiveDownSegments,
  } = useMultiPolyline(routeName, routeIds, selectedRouteId);

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
      {/* Route variant selector - show if there are multiple variants */}
      {availableRouteIds.length > 1 && selectedRouteId && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
            backgroundColor: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <label
            style={{
              fontSize: "12px",
              color: "#666",
              marginRight: "8px",
            }}
          >
            노선 ID:
          </label>
          <select
            value={selectedRouteId}
            onChange={(e) => updateSelectedRouteId(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "3px",
              border: "1px solid #ddd",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {availableRouteIds.map((routeId) => (
              <option key={routeId} value={routeId}>
                {routeId}
              </option>
            ))}
          </select>
        </div>
      )}

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