// src/features/live/components/AnimatedBusMarker.tsx

"use client";

import type { LatLngTuple } from "leaflet";
import type L from "leaflet";

import { BUS_ANIMATION_DURATION } from "@core/constants/env";

import RotatedMarker from "@live/components/RotatedMarker";
import { useAnimatedPosition } from "@live/hooks/useAnimatedPosition";

interface AnimatedBusMarkerProps {
    position: LatLngTuple;
    rotationAngle: number;
    icon: L.Icon | L.DivIcon;
    polyline?: LatLngTuple[];
    /** Animation duration in ms. Longer = smoother but more lag behind real-time data */
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
    animationDuration = BUS_ANIMATION_DURATION,
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
