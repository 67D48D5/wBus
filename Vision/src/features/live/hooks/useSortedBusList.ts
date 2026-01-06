// src/features/live/hooks/useSortedBusList.ts

import { useMemo } from "react";

import { useClosestStopOrd } from "@live/hooks/useBusStop";
import { useBusLocationData } from "@live/hooks/useBusLocation";
import { useBusDirection } from "@live/hooks/useBusDirection";
import { useBusStop } from "@live/hooks/useBusStop";

export const useSortedBusList = (routeName: string) => {
    const { data: mapList, error } = useBusLocationData(routeName);
    const getDirection = useBusDirection(routeName);
    const stops = useBusStop(routeName);
    const closestOrd = useClosestStopOrd(routeName);

    const stopMap = useMemo(
        () => new Map(stops.map((s) => [s.nodeid, s.nodeord])),
        [stops]
    );

    // Filter out buses at stops that don't exist in our database
    const validBuses = useMemo(
        () => mapList.filter((bus) => stopMap.has(bus.nodeid)),
        [mapList, stopMap]
    );

    const sortedList = useMemo(() => {
        if (!closestOrd) return validBuses;
        return [...validBuses].sort((a, b) => {
            const ordA = stopMap.get(a.nodeid) ?? Infinity;
            const ordB = stopMap.get(b.nodeid) ?? Infinity;
            return Math.abs(ordA - closestOrd) - Math.abs(ordB - closestOrd);
        });
    }, [validBuses, stopMap, closestOrd]);

    return { sortedList, getDirection, error };
};