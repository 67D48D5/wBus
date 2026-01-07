// src/app/live/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

import { busPollingService } from "@live/services/BusPollingService";
import { useRouteMap } from "@live/hooks/useRouteMap";

import Splash from "@live/components/MapSplash";
import MapNavBar from "@live/components/MapNavBar";
import MapWrapper from "@live/components/MapWrapper";
import BusList from "@live/components/BusList";
import MyLocation from "@live/components/MyLocation";

const ROUTE_PREFERENCE_KEY = "wbus_selected_route";
const DEFAULT_ROUTE = "30";

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
                const saved = localStorage.getItem(ROUTE_PREFERENCE_KEY);
                return saved || DEFAULT_ROUTE;
            } catch (e) {
                // localStorage might not be available
                console.warn("Failed to load route preference from localStorage", e);
            }
        }
        return DEFAULT_ROUTE;
    });

    const routeMap = useRouteMap();
    const allRoutes = useMemo(() => routeMap ? Object.keys(routeMap) : [], [routeMap]);

    // Persist route selection to localStorage
    const handleRouteChange = useCallback((route: string) => {
        setSelectedRoute(route);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(ROUTE_PREFERENCE_KEY, route);
            } catch (e) {
                // localStorage might not be available
                console.warn("Failed to save route preference to localStorage", e);
            }
        }
    }, []);

    // Effect for handling initial app loading and the splash screen
    useEffect(() => {
        const initializeApp = async () => {
            // Initialize app, fetch initial data
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Wait minimum display time for splash screen (200ms)
            await new Promise((resolve) => setTimeout(resolve, 200));

            setIsSplashVisible(false);
        };

        initializeApp();
    }, []);

    // Effect to start bus polling for selected route only
    useEffect(() => {
        if (!selectedRoute) return;

        const cleanup = busPollingService.startPolling(selectedRoute);

        return () => {
            cleanup();
        };
    }, [selectedRoute]);

    return (
        <>
            <Splash isVisible={isSplashVisible} />
            <div className="flex flex-col w-full h-[100dvh]">
                <MapNavBar />
                <div className="relative flex-1 overflow-hidden">
                    <MapWrapper routeNames={[selectedRoute]} />
                    <BusList
                        routeNames={[selectedRoute]}
                        allRoutes={allRoutes}
                        selectedRoute={selectedRoute}
                        onRouteChange={handleRouteChange}
                    />
                    <MyLocation />
                </div>
            </div>
        </>
    );
}
