// src/features/bus/hooks/useSortedBusList.ts

import { useMemo } from "react";
import { useBusLocationData } from "@bus/hooks/useBusLocation";
import { useBusDirection } from "@bus/hooks/useBusDirection";
import { useBusStop } from "@bus/hooks/useBusStop";
import { useClosestStopOrd } from "@bus/hooks/useBusStop";

export const useSortedBusList = (routeName: string) => {
    const { data: busList, error } = useBusLocationData(routeName);
    const getDirection = useBusDirection(routeName);
    const stops = useBusStop(routeName);
    const closestOrd = useClosestStopOrd(routeName);

    const stopMap = useMemo(
        () => new Map(stops.map((s) => [s.nodeid, s.nodeord])),
        [stops]
    );

    const sortedList = useMemo(() => {
        if (!closestOrd) return busList;
        return [...busList].sort((a, b) => {
            const ordA = stopMap.get(a.nodeid) ?? Infinity;
            const ordB = stopMap.get(b.nodeid) ?? Infinity;
            return Math.abs(ordA - closestOrd) - Math.abs(ordB - closestOrd);
        });
    }, [busList, stopMap, closestOrd]);

    return { sortedList, getDirection, error };
};