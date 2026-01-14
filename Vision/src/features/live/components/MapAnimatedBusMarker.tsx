// src/features/live/components/AnimatedBusMarker.tsx

"use client";

import type L from "leaflet";
import type { LatLngTuple } from "leaflet";

import { MAP_SETTINGS } from "@core/config/env";

import MapRotatedBusMarker from "@live/components/MapRotatedBusMarker";
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
    animationDuration = MAP_SETTINGS.ANIMATION.BUS_MOVE_MS,
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
        <MapRotatedBusMarker
            position={animatedPosition}
            rotationAngle={animatedAngle % 360}
            icon={icon}
            eventHandlers={eventHandlers}
        >
            {children}
        </MapRotatedBusMarker>
    );
}
