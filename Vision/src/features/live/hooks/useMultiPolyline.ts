// src/features/live/hooks/useMultiPolyline.ts

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@core/config/env";
import { LOG_MESSAGES } from "@core/config/locale";

import { getPolyline } from "@live/api/getStaticData";
import { transformPolyline } from "@live/utils/polyUtils";

import type { GeoPolylineData } from "@core/domain/live";

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
    const [dataMap, setDataMap] = useState<Map<string, GeoPolylineData | null>>(new Map());

    useEffect(() => {
        if (!routeName || routeIds.length === 0) {
            setDataMap(new Map());
            return;
        }

        // Load all polylines in parallel
        const loadPromises = routeIds.map(async (routeId) => {
            const routeKey = `${routeId}`;
            try {
                const data = await getPolyline(routeKey);
                return { routeId, data };
            } catch (error) {
                if (APP_CONFIG.IS_DEV) {
                    console.error(LOG_MESSAGES.FETCH_FAILED("Polyline", 500), "[" + routeId + "]", error);
                }
                return { routeId, data: null };
            }
        });

        Promise.all(loadPromises).then((results) => {
            const newMap = new Map<string, GeoPolylineData | null>();
            results.forEach(({ routeId, data }) => {
                newMap.set(routeId, data);
            });
            setDataMap(newMap);
        });
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

            // Process up direction segments
            upPolyline.forEach((coords) => {
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
            downPolyline.forEach((coords) => {
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
    }, [dataMap, routeIds]);

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
