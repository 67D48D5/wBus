// src/features/bus/components/BusAnimatedMarker.tsx

"use client";

import { memo } from "react";

import { MAP_SETTINGS } from "@core/config/env";

import { useAnimatedPosition } from "@map/hooks/useAnimatedPosition";

import BusRotatedMarker from "@bus/components/BusRotatedMarker";

import type { Icon, DivIcon, LeafletEventHandlerFnMap, LatLngTuple } from "leaflet";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface BusAnimatedMarkerProps {
    position: LatLngTuple;
    rotationAngle: number;
    icon: Icon | DivIcon;
    polyline?: LatLngTuple[];
    /** Animation duration in ms. Longer = smoother but more lag behind real-time data */
    animationDuration?: number;
    eventHandlers?: LeafletEventHandlerFnMap;
    children?: React.ReactNode;
}

// ----------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------

/**
 * Normalizes an angle to be within [0, 360) range.
 * Handles negative angles correctly (e.g., -90 -> 270).
 */
function normalizeAngle(angle: number): number {
    return ((angle % 360) + 360) % 360;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

/**
 * A bus marker that smoothly animates along a polyline when its position updates.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
function BusAnimatedMarker({
    position,
    rotationAngle,
    icon,
    polyline = [],
    animationDuration = MAP_SETTINGS.ANIMATION.BUS_MOVE_MS,
    eventHandlers,
    children,
}: BusAnimatedMarkerProps) {
    // Hook handles the interpolation loop (requestAnimationFrame)
    const { position: animatedPosition, angle: animatedAngle } = useAnimatedPosition(
        position,
        rotationAngle,
        {
            duration: animationDuration,
            polyline,
            // Only attempt to snap if we have a valid line segment
            snapToPolyline: polyline.length >= 2,
        }
    );

    return (
        <BusRotatedMarker
            position={animatedPosition}
            rotationAngle={normalizeAngle(animatedAngle)}
            icon={icon}
            eventHandlers={eventHandlers}
        >
            {children}
        </BusRotatedMarker>
    );
}

// Memoize to prevent re-setup of animation hook if parent re-renders 
// without actual data changes (e.g. map zoom/pan events passing through context)
export default memo(BusAnimatedMarker);
