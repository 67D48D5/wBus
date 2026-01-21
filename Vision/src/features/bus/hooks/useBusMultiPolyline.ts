// src/features/bus/hooks/useBusMultiPolyline.ts

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@core/config/env";

import { getPolyline, getRouteDetails, getStationMap } from "@bus/api/getStaticData";

import { mergePolylines, transformPolyline } from "@map/utils/polyUtils";

import { shouldSwapPolylines } from "@bus/utils/polylineDirection";

import type { GeoPolyline } from "@core/domain/polyline";
import type { RouteDetail } from "@core/domain/route";
import type { BusStop } from "@core/domain/station";

type PolylineSegment = {
    coords: [number, number][];
    routeIds: string[];  // Track ALL routeIds that share this segment
    direction: "up" | "down";
};

/**
 * Load polylines for multiple routeIds and remove duplicate segments.
 * Returns unique segments with metadata for styling.
 */
export function useMultiPolyline(
    routeName: string,
    routeIds: string[],
    activeRouteId?: string | null
) {
    const [dataMap, setDataMap] = useState<Map<string, GeoPolyline | null>>(new Map());
    const [routeDetailMap, setRouteDetailMap] = useState<Map<string, RouteDetail | null>>(new Map());
    const [stationMap, setStationMap] = useState<Record<string, BusStop> | null>(null);

    useEffect(() => {
        if (!routeName || routeIds.length === 0) {
            setDataMap(new Map());
            setRouteDetailMap(new Map());
            setStationMap(null);
            return;
        }

        // Load all polylines in parallel
        let cancelled = false;

        const loadData = async () => {
            let stations: Record<string, BusStop> | null = null;

            try {
                stations = await getStationMap();
            } catch (error) {
                if (APP_CONFIG.IS_DEV) {
                    console.error("[useMultiPolyline] Error fetching station map", error);
                }
            }

            const results = await Promise.all(routeIds.map(async (routeId) => {
                const routeKey = `${routeId}`;
                try {
                    const [data, routeDetail] = await Promise.all([
                        getPolyline(routeKey),
                        getRouteDetails(routeId),
                    ]);
                    return { routeId, data, routeDetail };
                } catch (error) {
                    if (APP_CONFIG.IS_DEV) {
                        console.error("[useMultiPolyline] Error fetching polyline data for routeId: " + routeId, error);
                    }
                    return { routeId, data: null, routeDetail: null };
                }
            }));

            if (cancelled) return;

            const newDataMap = new Map<string, GeoPolyline | null>();
            const newDetailMap = new Map<string, RouteDetail | null>();

            results.forEach(({ routeId, data, routeDetail }) => {
                newDataMap.set(routeId, data);
                newDetailMap.set(routeId, routeDetail ?? null);
            });

            setDataMap(newDataMap);
            setRouteDetailMap(newDetailMap);
            setStationMap(stations);
        };

        void loadData();

        return () => {
            cancelled = true;
        };
    }, [routeName, routeIds]);

    const segments = useMemo(() => {
        if (dataMap.size === 0) return { upSegments: [], downSegments: [] };

        const upSegments: PolylineSegment[] = [];
        const downSegments: PolylineSegment[] = [];
        const segmentMap = new Map<string, PolylineSegment>();

        // Helper to create a unique key for a segment
        const createSegmentKey = (coords: [number, number][]) => {
            return coords.map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join("|");
        };

        // Process each routeId's polyline
        routeIds.forEach((routeId) => {
            const data = dataMap.get(routeId);
            if (!data) return;

            const { upPolyline, downPolyline } = transformPolyline(data);
            const isRoundTrip =
                data.features.length === 1 &&
                data.features[0]?.properties?.is_turning_point === true;

            let finalUp = upPolyline;
            let finalDown = downPolyline;

            if (isRoundTrip) {
                const routeDetail = routeDetailMap.get(routeId) ?? null;
                const mergedUp = mergePolylines(upPolyline);
                const mergedDown = mergePolylines(downPolyline);

                if (shouldSwapPolylines(routeDetail, stationMap, mergedUp, mergedDown)) {
                    finalUp = downPolyline;
                    finalDown = upPolyline;
                }
            }

            // Process up direction segments
            finalUp.forEach((coords) => {
                const key = createSegmentKey(coords);
                if (segmentMap.has(key)) {
                    // Segment already exists, add this routeId to it
                    const segment = segmentMap.get(key)!;
                    if (!segment.routeIds.includes(routeId)) {
                        segment.routeIds.push(routeId);
                    }
                } else {
                    // New segment, create it with this routeId
                    const segment: PolylineSegment = {
                        coords,
                        routeIds: [routeId],
                        direction: "up",
                    };
                    segmentMap.set(key, segment);
                    upSegments.push(segment);
                }
            });

            // Process down direction segments
            finalDown.forEach((coords) => {
                const key = createSegmentKey(coords);
                if (segmentMap.has(key)) {
                    // Segment already exists, add this routeId to it
                    const segment = segmentMap.get(key)!;
                    if (!segment.routeIds.includes(routeId)) {
                        segment.routeIds.push(routeId);
                    }
                } else {
                    // New segment, create it with this routeId
                    const segment: PolylineSegment = {
                        coords,
                        routeIds: [routeId],
                        direction: "down",
                    };
                    segmentMap.set(key, segment);
                    downSegments.push(segment);
                }
            });
        });

        return { upSegments, downSegments };
    }, [dataMap, routeDetailMap, routeIds, stationMap]);

    // Classify segments into active and inactive
    // A segment is ACTIVE if:
    // 1. activeRouteId is set AND segment contains that routeId, OR
    // 2. segment's first routeId matches activeRouteId
    const { activeUpSegments, inactiveUpSegments, activeDownSegments, inactiveDownSegments } = useMemo(() => {
        const activeUpSegments: PolylineSegment[] = [];
        const inactiveUpSegments: PolylineSegment[] = [];
        const activeDownSegments: PolylineSegment[] = [];
        const inactiveDownSegments: PolylineSegment[] = [];

        segments.upSegments.forEach((segment) => {
            if (activeRouteId && segment.routeIds.includes(activeRouteId)) {
                activeUpSegments.push(segment);
            } else {
                inactiveUpSegments.push(segment);
            }
        });

        segments.downSegments.forEach((segment) => {
            if (activeRouteId && segment.routeIds.includes(activeRouteId)) {
                activeDownSegments.push(segment);
            } else {
                inactiveDownSegments.push(segment);
            }
        });

        return { activeUpSegments, inactiveUpSegments, activeDownSegments, inactiveDownSegments };
    }, [segments, activeRouteId]);

    return {
        activeUpSegments,
        inactiveUpSegments,
        activeDownSegments,
        inactiveDownSegments,
    };
}
