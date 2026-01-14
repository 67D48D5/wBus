// src/app/live/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

import { APP_CONFIG, MAP_SETTINGS, PREFERENCE_KEYS } from "@core/config/env";

import { busPollingService } from "@live/services/BusPollingService";
import { useRouteMap } from "@live/hooks/useRouteMap";

import Splash from "@live/components/MapSplash";
import MapNavBar from "@live/components/MapNavBar";
import MapWrapper from "@live/components/MapWrapper";
import BusList from "@live/components/BusList";

/**
 * Real-time bus map page for the wBus application.
 * Displays real-time bus location information on a map for all routes.
 */
export default function MapPage() {
    const [isSplashVisible, setIsSplashVisible] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState<string>(() => {
        // Initialize from localStorage if available
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem(PREFERENCE_KEYS.SELECTED_ROUTE);
                return saved || MAP_SETTINGS.DEFAULT_ROUTE;
            } catch (e) {
                // localStorage might not be available
                if (APP_CONFIG.IS_DEV) {
                    console.warn("[MapPage] Failed to load route preference from localStorage", e);
                }
            }
        }
        return MAP_SETTINGS.DEFAULT_ROUTE;
    });

    const routeMap = useRouteMap();
    const allRoutes = useMemo(() => routeMap ? Object.keys(routeMap) : [], [routeMap]);

    // Persist route selection to localStorage
    const handleRouteChange = useCallback((route: string) => {
        setSelectedRoute(route);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(PREFERENCE_KEYS.SELECTED_ROUTE, route);
            } catch (e) {
                // localStorage might not be available
                if (APP_CONFIG.IS_DEV) {
                    console.warn("[MapPage] Failed to save route preference to localStorage", e);
                }
            }
        }
    }, []);

    const handleMapReady = useCallback(() => {
        setIsSplashVisible(false);
    }, []);

    // Effect to start bus polling for selected route only
    useEffect(() => {
        if (!selectedRoute) return;

        const cleanup = busPollingService.startPolling(selectedRoute);

        return () => {
            cleanup();
        };
    }, [selectedRoute]);

    useEffect(() => {
        if (!routeMap) return;
        if (routeMap[selectedRoute]) return;

        const fallbackRoute = routeMap[MAP_SETTINGS.DEFAULT_ROUTE]
            ? MAP_SETTINGS.DEFAULT_ROUTE
            : Object.keys(routeMap)[0];

        if (fallbackRoute) {
            handleRouteChange(fallbackRoute);
        }
    }, [routeMap, selectedRoute, handleRouteChange]);

    return (
        <>
            <Splash isVisible={isSplashVisible} />
            <div className="flex flex-col w-full h-[100dvh]">
                <MapNavBar />
                <div className="relative flex-1 overflow-hidden">
                    <MapWrapper
                        routeNames={[selectedRoute]}
                        onReady={handleMapReady}
                        onRouteChange={handleRouteChange}
                    />
                    <BusList
                        routeNames={[selectedRoute]}
                        allRoutes={allRoutes}
                        selectedRoute={selectedRoute}
                        onRouteChange={handleRouteChange}
                    />
                </div>
            </div>
        </>
    );
}
