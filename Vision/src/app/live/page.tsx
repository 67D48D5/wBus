// src/app/live/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";

import { busPollingService } from "@live/services/BusPollingService";
import { useRouteMap } from "@live/hooks/useRouteMap";

import Splash from "@live/components/MapSplash";
import MapNavBar from "@live/components/MapNavBar";
import MapWrapper from "@live/components/MapWrapper";
import BusList from "@live/components/BusList";
import MyLocation from "@live/components/MyLocation";

/**
 * Real-time bus map page for the wBus application.
 * Displays real-time bus location information on a map for all routes.
 */
export default function MapPage() {
    const [isSplashVisible, setIsSplashVisible] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState<string>("30");

    const routeMap = useRouteMap();
    const allRoutes = useMemo(() => routeMap ? Object.keys(routeMap) : [], [routeMap]);

    // Effect for handling initial app loading and the splash screen
    useEffect(() => {
        const initializeApp = async () => {
            // Initialize app, fetch initial data
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Wait minimum display time for splash screen (300ms)
            await new Promise((resolve) => setTimeout(resolve, 300));

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
                    {selectedRoute && (
                        <>
                            <MapWrapper routeNames={[selectedRoute]} />
                            <BusList
                                routeNames={[selectedRoute]}
                                allRoutes={allRoutes}
                                selectedRoute={selectedRoute}
                                onRouteChange={setSelectedRoute}
                            />
                        </>
                    )}
                    <MyLocation />
                </div>
            </div>
        </>
    );
}
