// src/app/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

import { APP_CONFIG, MAP_SETTINGS, STORAGE_KEYS } from "@core/config/env";

import { busPollingService } from "@bus/services/BusPollingService";
import { useRouteMap } from "@bus/hooks/useRouteMap";

import MapWrapper from "@map/components/MapWrapper";

import BusList from "@bus/components/BusList";

import ScheduleOverlay from "@schedule/components/ScheduleOverlay";

import Splash from "@shared/ui/Splash";
import NavBar from "@shared/ui/NavBar";

/**
 * Real-time bus map page for the wBus application.
 * Displays real-time bus location information on a map for all routes.
 */
export default function HomePage() {
    const [isSplashVisible, setIsSplashVisible] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState<string>(MAP_SETTINGS.DEFAULT_ROUTE);

    const routeMap = useRouteMap();
    const allRoutes = useMemo(() => routeMap ? Object.keys(routeMap) : [], [routeMap]);

    // Persist route selection to localStorage
    const handleRouteChange = useCallback((route: string) => {
        setSelectedRoute(route);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(STORAGE_KEYS.ROUTE_ID, route);
            } catch (e) {
                // localStorage might not be available
                if (APP_CONFIG.IS_DEV) {
                    console.warn("[HomePage] Failed to save route preference to localStorage", e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.ROUTE_ID);
            if (saved) setSelectedRoute(saved);
        } catch (e) {
            if (APP_CONFIG.IS_DEV) {
                console.warn("[HomePage] Failed to load route preference from localStorage", e);
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
            <div className="flex flex-col w-full min-h-[100svh] h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                <NavBar />
                <div className="relative flex-1 overflow-hidden">
                    <MapWrapper
                        routeNames={[selectedRoute]}
                        onReady={handleMapReady}
                        onRouteChange={handleRouteChange}
                    />
                    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-[calc(env(safe-area-inset-left)+0.5rem)] z-30 flex flex-col gap-3 sm:bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:left-[calc(env(safe-area-inset-left)+1rem)]">
                        <ScheduleOverlay routeId={selectedRoute} />
                        <BusList
                            routeNames={[selectedRoute]}
                            allRoutes={allRoutes}
                            selectedRoute={selectedRoute}
                            onRouteChange={handleRouteChange}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
