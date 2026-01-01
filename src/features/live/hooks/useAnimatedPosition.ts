// src/features/live/hooks/useAnimatedPosition.ts

"use client";

import { useRef, useState, useEffect, useCallback } from "react";

import type { LatLngTuple } from "leaflet";

interface AnimatedPositionState {
    position: LatLngTuple;
    angle: number;
}

interface UseAnimatedPositionOptions {
    /** Duration of the animation in milliseconds */
    duration?: number;
    /** Polyline to snap the animation path to */
    polyline?: LatLngTuple[];
    /** Whether to animate along the polyline or directly */
    snapToPolyline?: boolean;
}

/**
 * Calculate the distance between two points using Euclidean formula
 */
function getDistance(p1: LatLngTuple, p2: LatLngTuple): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the bearing (angle) between two points
 */
function getBearing(from: LatLngTuple, to: LatLngTuple): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const lat1 = toRad(from[0]);
    const lon1 = toRad(from[1]);
    const lat2 = toRad(to[0]);
    const lon2 = toRad(to[1]);
    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
}

/**
 * Find the closest segment on a polyline to a given point.
 * Returns the segment index and the projected position on that segment.
 */
function findClosestSegment(
    point: LatLngTuple,
    polyline: LatLngTuple[]
): { segmentIndex: number; projectedPosition: LatLngTuple; t: number } {
    if (polyline.length < 2) {
        return { segmentIndex: 0, projectedPosition: polyline[0] || point, t: 0 };
    }

    let minDist = Infinity;
    let closestSegmentIndex = 0;
    let closestProjection: LatLngTuple = polyline[0];
    let closestT = 0;

    // Scale longitude by cos(latitude) to account for Earth's curvature
    const latRad = (point[0] * Math.PI) / 180;
    const lngScale = Math.cos(latRad);

    for (let i = 0; i < polyline.length - 1; i++) {
        const A = polyline[i];
        const B = polyline[i + 1];

        // Calculate projection
        const AP = [point[0] - A[0], point[1] - A[1]];
        const AB = [B[0] - A[0], B[1] - A[1]];
        const ab2 = AB[0] * AB[0] + AB[1] * AB[1];

        let t = 0;
        if (ab2 > 0) {
            const dot = AP[0] * AB[0] + AP[1] * AB[1];
            t = Math.max(0, Math.min(1, dot / ab2));
        }

        const proj: LatLngTuple = [A[0] + AB[0] * t, A[1] + AB[1] * t];

        // Calculate distance with longitude scaling
        const dLat = proj[0] - point[0];
        const dLng = (proj[1] - point[1]) * lngScale;
        const dist = dLat * dLat + dLng * dLng;

        if (dist < minDist) {
            minDist = dist;
            closestSegmentIndex = i;
            closestProjection = proj;
            closestT = t;
        }
    }

    return {
        segmentIndex: closestSegmentIndex,
        projectedPosition: closestProjection,
        t: closestT,
    };
}

/**
 * Interpolate along polyline between two segment positions.
 * This ensures the animation stays exactly on the polyline.
 */
function interpolateAlongPolylineSegments(
    polyline: LatLngTuple[],
    startSegment: { index: number; position: LatLngTuple },
    endSegment: { index: number; position: LatLngTuple },
    progress: number
): { position: LatLngTuple; angle: number } {
    if (polyline.length < 2) {
        return { position: endSegment.position, angle: 0 };
    }

    // Build the path: startPosition -> intermediate vertices -> endPosition
    const path: LatLngTuple[] = [startSegment.position];

    // Determine direction
    const forward = endSegment.index >= startSegment.index;

    if (forward) {
        // Add vertices between start and end segments
        for (let i = startSegment.index + 1; i <= endSegment.index; i++) {
            path.push(polyline[i]);
        }
    } else {
        // Going backward
        for (let i = startSegment.index; i > endSegment.index; i--) {
            path.push(polyline[i]);
        }
    }

    // Add the final position on the end segment
    path.push(endSegment.position);

    // Handle edge case where we only have one point
    if (path.length < 2) {
        return { position: endSegment.position, angle: 0 };
    }

    // Calculate cumulative distances
    const distances: number[] = [0];
    for (let i = 1; i < path.length; i++) {
        distances.push(distances[i - 1] + getDistance(path[i - 1], path[i]));
    }
    const totalDistance = distances[distances.length - 1];

    if (totalDistance === 0) {
        return { position: endSegment.position, angle: 0 };
    }

    // Find position at current progress
    const targetDistance = totalDistance * progress;

    // Find which segment we're on
    let segmentIdx = 0;
    for (let i = 1; i < distances.length; i++) {
        if (distances[i] >= targetDistance) {
            segmentIdx = i - 1;
            break;
        }
        segmentIdx = i - 1;
    }

    // Interpolate within the segment
    const segmentStart = distances[segmentIdx];
    const segmentEnd = distances[segmentIdx + 1] || segmentStart;
    const segmentLength = segmentEnd - segmentStart;

    let t = 0;
    if (segmentLength > 0) {
        t = (targetDistance - segmentStart) / segmentLength;
    }

    const p1 = path[segmentIdx];
    const p2 = path[segmentIdx + 1] || p1;

    const position: LatLngTuple = [
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t,
    ];

    const angle = getBearing(p1, p2);

    return { position, angle };
}

/**
 * Simple linear interpolation between two positions
 */
function interpolateLinear(
    from: LatLngTuple,
    to: LatLngTuple,
    progress: number
): { position: LatLngTuple; angle: number } {
    const position: LatLngTuple = [
        from[0] + (to[0] - from[0]) * progress,
        from[1] + (to[1] - from[1]) * progress,
    ];

    const angle = getBearing(from, to);

    return { position, angle };
}

/**
 * Smoothly interpolate rotation angle, handling the 360° wrap-around
 */
function interpolateAngle(from: number, to: number, progress: number): number {
    // Normalize angles to 0-360 range
    from = ((from % 360) + 360) % 360;
    to = ((to % 360) + 360) % 360;

    // Find the shortest rotation direction
    let diff = to - from;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return from + diff * progress;
}

/**
 * Easing function for smooth animation (ease-out cubic)
 */
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Hook that provides smooth animated position transitions along a polyline
 */
export function useAnimatedPosition(
    targetPosition: LatLngTuple,
    targetAngle: number,
    options: UseAnimatedPositionOptions = {}
): AnimatedPositionState {
    const { duration = 1000, polyline = [], snapToPolyline = true } = options;

    const [state, setState] = useState<AnimatedPositionState>({
        position: targetPosition,
        angle: targetAngle,
    });

    const animationRef = useRef<number | null>(null);
    const startStateRef = useRef<AnimatedPositionState>({
        position: targetPosition,
        angle: targetAngle,
    });
    const startTimeRef = useRef<number>(0);
    const prevTargetRef = useRef<LatLngTuple>(targetPosition);
    const isFirstRender = useRef(true);

    const animate = useCallback(
        (
            startPosition: LatLngTuple,
            startAngle: number,
            endPosition: LatLngTuple,
            endAngle: number,
            startTime: number,
            startSegment: { index: number; position: LatLngTuple },
            endSegment: { index: number; position: LatLngTuple }
        ) => {
            const shouldSnapToPolyline = snapToPolyline && polyline.length >= 2;

            const tick = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const rawProgress = Math.min(elapsed / duration, 1);
                const progress = easeOutCubic(rawProgress);

                let newPosition: LatLngTuple;
                let newAngle: number;

                if (shouldSnapToPolyline) {
                    // Animate along the polyline segments
                    const result = interpolateAlongPolylineSegments(
                        polyline,
                        startSegment,
                        endSegment,
                        progress
                    );
                    newPosition = result.position;
                    newAngle = interpolateAngle(startAngle, result.angle, progress);
                } else {
                    // Simple linear interpolation
                    const result = interpolateLinear(
                        startPosition,
                        endPosition,
                        progress
                    );
                    newPosition = result.position;
                    newAngle = interpolateAngle(startAngle, endAngle, progress);
                }

                setState({
                    position: newPosition,
                    angle: newAngle,
                });

                if (rawProgress < 1) {
                    animationRef.current = requestAnimationFrame(tick);
                } else {
                    // Ensure we end exactly at the snapped target position
                    setState({
                        position: shouldSnapToPolyline ? endSegment.position : endPosition,
                        angle: endAngle,
                    });
                }
            };

            animationRef.current = requestAnimationFrame(tick);
        },
        [duration, polyline, snapToPolyline]
    );

    useEffect(() => {
        // Skip animation on first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            // Snap initial position to polyline
            let initialPosition = targetPosition;
            if (snapToPolyline && polyline.length >= 2) {
                const segment = findClosestSegment(targetPosition, polyline);
                initialPosition = segment.projectedPosition;
            }
            setState({
                position: initialPosition,
                angle: targetAngle,
            });
            prevTargetRef.current = targetPosition;
            startStateRef.current = {
                position: initialPosition,
                angle: targetAngle,
            };
            return;
        }

        // Check if position actually changed
        const prevTarget = prevTargetRef.current;
        const positionChanged =
            targetPosition[0] !== prevTarget[0] || targetPosition[1] !== prevTarget[1];

        if (!positionChanged) {
            // Just update angle if position hasn't changed
            if (targetAngle !== state.angle) {
                setState((prev) => ({ ...prev, angle: targetAngle }));
            }
            return;
        }

        // Cancel any ongoing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        // Store start state
        startStateRef.current = { ...state };
        startTimeRef.current = performance.now();
        prevTargetRef.current = targetPosition;

        // Find segment positions for animation path
        let startSegment = { index: 0, position: state.position };
        let endSegment = { index: 0, position: targetPosition };

        if (polyline.length >= 2) {
            const startResult = findClosestSegment(state.position, polyline);
            const endResult = findClosestSegment(targetPosition, polyline);
            startSegment = { index: startResult.segmentIndex, position: startResult.projectedPosition };
            endSegment = { index: endResult.segmentIndex, position: endResult.projectedPosition };
        }

        // Start animation
        animate(
            startStateRef.current.position,
            startStateRef.current.angle,
            targetPosition,
            targetAngle,
            startTimeRef.current,
            startSegment,
            endSegment
        );

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [targetPosition, targetAngle, animate, polyline, state]);

    return state;
}
