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
 * Find the index of the closest point on the polyline to a given point
 */
function findClosestPointIndex(
    point: LatLngTuple,
    polyline: LatLngTuple[]
): number {
    let minDist = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < polyline.length; i++) {
        const dist = getDistance(point, polyline[i]);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    }

    return closestIndex;
}

/**
 * Get cumulative distances along a polyline
 */
function getCumulativeDistances(polyline: LatLngTuple[]): number[] {
    const distances: number[] = [0];
    for (let i = 1; i < polyline.length; i++) {
        distances.push(distances[i - 1] + getDistance(polyline[i - 1], polyline[i]));
    }
    return distances;
}

/**
 * Interpolate a position along a polyline given a progress value (0-1)
 */
function interpolateAlongPolyline(
    polyline: LatLngTuple[],
    startIndex: number,
    endIndex: number,
    progress: number
): { position: LatLngTuple; angle: number } {
    if (polyline.length < 2 || startIndex === endIndex) {
        return {
            position: polyline[endIndex] || polyline[0],
            angle: 0,
        };
    }

    // Determine direction (forward or backward along polyline)
    const forward = endIndex > startIndex;
    const step = forward ? 1 : -1;

    // Build the path segment between start and end
    const pathSegment: LatLngTuple[] = [];
    for (let i = startIndex; forward ? i <= endIndex : i >= endIndex; i += step) {
        pathSegment.push(polyline[i]);
    }

    if (pathSegment.length < 2) {
        return {
            position: polyline[endIndex],
            angle: getBearing(polyline[startIndex], polyline[endIndex]),
        };
    }

    // Calculate cumulative distances along the path segment
    const distances = getCumulativeDistances(pathSegment);
    const totalDistance = distances[distances.length - 1];

    if (totalDistance === 0) {
        return {
            position: pathSegment[pathSegment.length - 1],
            angle: 0,
        };
    }

    // Find the target distance based on progress
    const targetDistance = totalDistance * progress;

    // Find which segment we're on
    let segmentIndex = 0;
    for (let i = 1; i < distances.length; i++) {
        if (distances[i] >= targetDistance) {
            segmentIndex = i - 1;
            break;
        }
        segmentIndex = i - 1;
    }

    // Interpolate within the segment
    const segmentStart = distances[segmentIndex];
    const segmentEnd = distances[segmentIndex + 1] || distances[segmentIndex];
    const segmentLength = segmentEnd - segmentStart;

    let t = 0;
    if (segmentLength > 0) {
        t = (targetDistance - segmentStart) / segmentLength;
    }

    const p1 = pathSegment[segmentIndex];
    const p2 = pathSegment[segmentIndex + 1] || p1;

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
            startState: AnimatedPositionState,
            endPosition: LatLngTuple,
            endAngle: number,
            startTime: number,
            startIdx: number,
            endIdx: number
        ) => {
            const tick = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const rawProgress = Math.min(elapsed / duration, 1);
                const progress = easeOutCubic(rawProgress);

                let newPosition: LatLngTuple;
                let newAngle: number;

                if (snapToPolyline && polyline.length >= 2 && startIdx !== endIdx) {
                    // Animate along the polyline
                    const result = interpolateAlongPolyline(
                        polyline,
                        startIdx,
                        endIdx,
                        progress
                    );
                    newPosition = result.position;
                    // Blend between polyline angle and target angle for smoother rotation
                    newAngle = interpolateAngle(startState.angle, result.angle, progress);
                } else {
                    // Simple linear interpolation
                    const result = interpolateLinear(
                        startState.position,
                        endPosition,
                        progress
                    );
                    newPosition = result.position;
                    newAngle = interpolateAngle(startState.angle, endAngle, progress);
                }

                setState({
                    position: newPosition,
                    angle: newAngle,
                });

                if (rawProgress < 1) {
                    animationRef.current = requestAnimationFrame(tick);
                } else {
                    // Ensure we end exactly at the target
                    setState({
                        position: endPosition,
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
            setState({
                position: targetPosition,
                angle: targetAngle,
            });
            prevTargetRef.current = targetPosition;
            startStateRef.current = {
                position: targetPosition,
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

        // Find indices on polyline for animation path
        let startIdx = 0;
        let endIdx = 0;
        if (polyline.length >= 2) {
            startIdx = findClosestPointIndex(state.position, polyline);
            endIdx = findClosestPointIndex(targetPosition, polyline);
        }

        // Start animation
        animate(
            startStateRef.current,
            targetPosition,
            targetAngle,
            startTimeRef.current,
            startIdx,
            endIdx
        );

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [targetPosition, targetAngle, animate, polyline, state]);

    return state;
}
