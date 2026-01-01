// src/features/live/components/AnimatedBusMarker.tsx

"use client";

import { memo } from "react";

import type { LatLngTuple } from "leaflet";
import type L from "leaflet";

import RotatedMarker from "@live/components/RotatedMarker";
import { useAnimatedPosition } from "@live/hooks/useAnimatedPosition";

interface AnimatedBusMarkerProps {
    position: LatLngTuple;
    rotationAngle: number;
    icon: L.Icon | L.DivIcon;
    polyline?: LatLngTuple[];
    animationDuration?: number;
    children?: React.ReactNode;
    eventHandlers?: L.LeafletEventHandlerFnMap;
}

/**
 * A bus marker that smoothly animates along a polyline when its position updates.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
function AnimatedBusMarkerComponent({
    position,
    rotationAngle,
    icon,
    polyline = [],
    animationDuration = 1000,
    children,
    eventHandlers,
}: AnimatedBusMarkerProps) {
    const { position: animatedPosition, angle: animatedAngle } = useAnimatedPosition(
        position,
        rotationAngle,
        {
            duration: animationDuration,
            polyline,
            snapToPolyline: polyline.length >= 2,
        }
    );

    return (
        <RotatedMarker
            position={animatedPosition}
            rotationAngle={animatedAngle % 360}
            icon={icon}
            eventHandlers={eventHandlers}
        >
            {children}
        </RotatedMarker>
    );
}

// Memoize to prevent unnecessary re-renders
export const AnimatedBusMarker = memo(AnimatedBusMarkerComponent);
