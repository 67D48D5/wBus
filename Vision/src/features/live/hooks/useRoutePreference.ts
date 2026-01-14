// src/features/live/hooks/useRoutePreference.ts

import { useCallback, useEffect, useState } from "react";

import { APP_CONFIG, STORAGE_KEYS } from "@core/config/env";

/**
 * Hook to manage user's selected routeId preference using localStorage.
 * Remembers which route variant the user last selected.
 */
export function useRoutePreference(
    routeName: string,
    availableRouteIds: string[],
    liveRouteId: string | null
) {
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Load saved preference from localStorage on mount
    useEffect(() => {
        setIsMounted(true);
        try {
            const saved = localStorage.getItem(`${STORAGE_KEYS.ROUTE_ID}_${routeName}`);
            if (saved && availableRouteIds.includes(saved)) {
                setSelectedRouteId(saved);
                return;
            }
        } catch (e) {
            // localStorage might not be available
        }

        // Fallback: use live routeId or first available
        if (liveRouteId && availableRouteIds.includes(liveRouteId)) {
            setSelectedRouteId(liveRouteId);
        } else if (availableRouteIds.length > 0) {
            setSelectedRouteId(availableRouteIds[0]);
        }
    }, [routeName, availableRouteIds, liveRouteId]);

    // Save preference to localStorage when it changes
    const updateSelectedRouteId = useCallback(
        (routeId: string) => {
            if (availableRouteIds.includes(routeId)) {
                setSelectedRouteId(routeId);
                try {
                    localStorage.setItem(`${STORAGE_KEYS.ROUTE_ID}_${routeName}`, routeId);
                } catch (e) {
                    // localStorage might not be available
                    if (APP_CONFIG.IS_DEV)
                        console.warn("[useRoutePreference] Failed to save route preference to localStorage:", e);
                }
            }
        },
        [routeName, availableRouteIds]
    );

    return {
        selectedRouteId: isMounted ? selectedRouteId : null,
        updateSelectedRouteId,
        availableRouteIds,
    };
}
