// src/features/bus/hooks/useBusMultiPolyline.ts

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@core/config/env";

import { getPolyline, getRouteDetails, getStationMap } from "@bus/api/getStaticData";

import {
    hasExplicitPolylineDirections,
    mergePolylines,
    transformPolyline
} from "@bus/utils/polyUtils";

import { shouldSwapPolylines } from "@bus/utils/polylineDirection";

import type { GeoPolyline } from "@core/domain/polyline";
import type { RouteDetail } from "@core/domain/route";
import type { StationLocation } from "@core/domain/station";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type Coordinate = [number, number];

export interface PolylineSegment {
    coords: Coordinate[];
    routeIds: string[]; // List of routes sharing this specific geometry
    direction: "up" | "down";
}

interface FetchedData {
    dataMap: Map<string, GeoPolyline>;
    detailMap: Map<string, RouteDetail | null>;
    stationMap: Record<string, StationLocation> | null;
}

interface SegmentBucket {
    upSegments: PolylineSegment[];
    downSegments: PolylineSegment[];
}

// ----------------------------------------------------------------------
// Helpers: Pure Logic
// ----------------------------------------------------------------------

/**
 * Generates a unique string key for a coordinate array to detect duplicates.
 * Using toFixed(6) handles floating point precision issues.
 */
function generateSegmentKey(coords: Coordinate[]): string {
    // Optimization: Only use start, mid, and end points for hash if segments are long?
    // For safety, we currently stringify the whole path.
    return coords.map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join("|");
}

/**
 * Merges new segments into an existing map of unique segments.
 * If a segment exists (geometry matches), we just append the routeId.
 */
function mergeIntoSegmentMap(
    segmentMap: Map<string, PolylineSegment>,
    coordsList: Coordinate[][],
    routeId: string,
    direction: "up" | "down"
) {
    coordsList.forEach((coords) => {
        if (coords.length < 2) return;

        const key = generateSegmentKey(coords);
        const existing = segmentMap.get(key);

        if (existing) {
            if (!existing.routeIds.includes(routeId)) {
                existing.routeIds.push(routeId);
            }
        } else {
            segmentMap.set(key, {
                coords,
                routeIds: [routeId],
                direction,
            });
        }
    });
}

/**
 * Core processing logic:
 * 1. Transforms GeoJSON to segments
 * 2. Checks for legacy direction swapping
 * 3. Deduplicates segments across multiple routes
 */
function processAllRoutes(
    routeIds: string[],
    fetched: FetchedData
): SegmentBucket {
    const segmentMap = new Map<string, PolylineSegment>();

    routeIds.forEach((routeId) => {
        const data = fetched.dataMap.get(routeId);
        if (!data) return;

        // 1. Transform (Split)
        const { upPolyline, downPolyline } = transformPolyline(data);

        // 2. Direction Correction
        let finalUp = upPolyline;
        let finalDown = downPolyline;

        const hasExplicit = hasExplicitPolylineDirections(data);

        if (!hasExplicit) {
            const detail = fetched.detailMap.get(routeId) ?? null;
            // We need merged lines for the swap check heuristic
            const mergedUp = mergePolylines(upPolyline);
            const mergedDown = mergePolylines(downPolyline);

            if (shouldSwapPolylines(detail, fetched.stationMap, mergedUp, mergedDown)) {
                finalUp = downPolyline;
                finalDown = upPolyline;
            }
        }

        // 3. Deduplicate / Merge
        mergeIntoSegmentMap(segmentMap, finalUp, routeId, "up");
        mergeIntoSegmentMap(segmentMap, finalDown, routeId, "down");
    });

    // Convert Map values to Arrays
    const upSegments: PolylineSegment[] = [];
    const downSegments: PolylineSegment[] = [];

    for (const segment of segmentMap.values()) {
        if (segment.direction === "up") upSegments.push(segment);
        else downSegments.push(segment);
    }

    return { upSegments, downSegments };
}

// ----------------------------------------------------------------------
// Main Hook
// ----------------------------------------------------------------------

export function useMultiPolyline(
    routeName: string,
    routeIds: string[],
    activeRouteId?: string | null
) {
    const [fetched, setFetched] = useState<FetchedData>({
        dataMap: new Map(),
        detailMap: new Map(),
        stationMap: null,
    });

    // 1. Fetch Data
    useEffect(() => {
        if (!routeName || routeIds.length === 0) {
            setFetched({ dataMap: new Map(), detailMap: new Map(), stationMap: null });
            return;
        }

        let isMounted = true;

        const loadData = async () => {
            // Parallel Fetch: Station Map + All Routes
            const stationMapPromise = getStationMap().catch((err) => {
                if (APP_CONFIG.IS_DEV) console.error("[useMultiPolyline] Station Map Error", err);
                return null;
            });

            const routesPromise = Promise.all(
                routeIds.map(async (routeId) => {
                    try {
                        // Note: getPolyline takes a 'routeKey' which is usually just routeId
                        const [data, routeDetail] = await Promise.all([
                            getPolyline(routeId),
                            getRouteDetails(routeId),
                        ]);
                        return { routeId, data, routeDetail };
                    } catch (error) {
                        if (APP_CONFIG.IS_DEV) {
                            console.error(`[useMultiPolyline] Failed to load ${routeId}`, error);
                        }
                        return { routeId, data: null, routeDetail: null };
                    }
                })
            );

            const [stationMap, routesResult] = await Promise.all([
                stationMapPromise,
                routesPromise,
            ]);

            if (!isMounted) return;

            const newDataMap = new Map<string, GeoPolyline>();
            const newDetailMap = new Map<string, RouteDetail | null>();

            routesResult.forEach(({ routeId, data, routeDetail }) => {
                if (data) newDataMap.set(routeId, data);
                newDetailMap.set(routeId, routeDetail);
            });

            setFetched({
                dataMap: newDataMap,
                detailMap: newDetailMap,
                stationMap,
            });
        };

        void loadData();

        return () => {
            isMounted = false;
        };
    }, [routeName, routeIds]); // Re-fetch only if routeName or IDs change

    // 2. Process & Deduplicate Segments
    const allSegments = useMemo(() => {
        if (fetched.dataMap.size === 0) {
            return { upSegments: [], downSegments: [] };
        }
        return processAllRoutes(routeIds, fetched);
    }, [fetched, routeIds]);

    // 3. Filter Active/Inactive
    const result = useMemo(() => {
        const activeUp: PolylineSegment[] = [];
        const inactiveUp: PolylineSegment[] = [];
        const activeDown: PolylineSegment[] = [];
        const inactiveDown: PolylineSegment[] = [];

        const split = (
            source: PolylineSegment[],
            activeTarget: PolylineSegment[],
            inactiveTarget: PolylineSegment[]
        ) => {
            source.forEach((seg) => {
                // A segment is active if it contains the currently selected routeId
                if (activeRouteId && seg.routeIds.includes(activeRouteId)) {
                    activeTarget.push(seg);
                } else {
                    inactiveTarget.push(seg);
                }
            });
        };

        split(allSegments.upSegments, activeUp, inactiveUp);
        split(allSegments.downSegments, activeDown, inactiveDown);

        return {
            activeUpSegments: activeUp,
            inactiveUpSegments: inactiveUp,
            activeDownSegments: activeDown,
            inactiveDownSegments: inactiveDown,
        };
    }, [allSegments, activeRouteId]);

    return result;
}
