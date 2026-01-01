// src/features/live/components/AnimatedBusMarker.tsx

"use client";

import type { LatLngTuple } from "leaflet";
import type L from "leaflet";

import RotatedMarker from "@live/components/RotatedMarker";
import { useAnimatedPosition } from "@live/hooks/useAnimatedPosition";

interface AnimatedBusMarkerProps {
    position: LatLngTuple;
    rotationAngle: number;
    icon: L.Icon | L.DivIcon;
    polyline?: LatLngTuple[];
    /** Animation duration in ms. Keep low (300-500ms) to avoid lag behind real-time data */
    animationDuration?: number;
    children?: React.ReactNode;
    eventHandlers?: L.LeafletEventHandlerFnMap;
}

/**
 * A bus marker that smoothly animates along a polyline when its position updates.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
export function AnimatedBusMarker({
    position,
    rotationAngle,
    icon,
    polyline = [],
    animationDuration = 500,
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
