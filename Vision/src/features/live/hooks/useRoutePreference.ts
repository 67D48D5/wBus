// src/features/live/hooks/useRoutePreference.ts

import { useCallback, useEffect, useState } from "react";

const ROUTE_PREFERENCE_KEY = "wbus_selected_routeId";

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
            const saved = localStorage.getItem(`${ROUTE_PREFERENCE_KEY}_${routeName}`);
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
                    localStorage.setItem(`${ROUTE_PREFERENCE_KEY}_${routeName}`, routeId);
                } catch (e) {
                    // localStorage might not be available
                    console.warn("Failed to save route preference to localStorage", e);
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
