// src/app/live/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";

import { busPollingService } from "@live/services/BusPollingService";
import { useRouteMap } from "@live/hooks/useRouteMap";

import Splash from "@live/components/MapSplash";
import NavBar from "@live/components/NavBar";
import MapWrapper from "@live/components/MapWrapper";
import BusList from "@live/components/BusList";
import MyLocation from "@live/components/MyLocation";

/**
 * Real-time bus map page for the wBus application.
 * Displays real-time bus location information on a map for all routes.
 */
export default function MapPage() {
    const [isSplashVisible, setIsSplashVisible] = useState(true);
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

    // Effect to start bus polling for all routes
    useEffect(() => {
        if (allRoutes.length === 0) return;

        const cleanupFunctions = allRoutes.map((routeName) =>
            busPollingService.startPolling(routeName)
        );

        return () => {
            cleanupFunctions.forEach((cleanup) => cleanup());
        };
    }, [allRoutes]);

    return (
        <>
            <Splash isVisible={isSplashVisible} />
            <div className="flex flex-col w-full h-[100dvh]">
                <NavBar />
                <div className="relative flex-1 overflow-hidden">
                    {allRoutes.length > 0 && (
                        <>
                            <MapWrapper routeNames={allRoutes} />
                            <BusList routeNames={allRoutes} />
                        </>
                    )}
                    <MyLocation />
                </div>
            </div>
        </>
    );
}
