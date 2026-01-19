// src/features/map/hooks/useAnimatedPosition.ts

"use client";

import { useRef, useState, useEffect } from "react";

import { MAP_SETTINGS } from "@core/config/env";

import type { LatLngTuple } from "leaflet";

interface AnimatedPositionState {
    position: LatLngTuple;
    angle: number;
}

interface UseAnimatedPositionOptions {
    /** Duration of the animation in milliseconds. Longer = smoother but more lag behind real-time data */
    duration?: number;
    /** Polyline to snap the animation path to */
    polyline?: LatLngTuple[];
    /** Whether to animate along the polyline or directly */
    snapToPolyline?: boolean;
}

/**
 * Calculate the squared distance between two points (faster than sqrt for comparison)
 */
function getSquaredDistance(p1: LatLngTuple, p2: LatLngTuple, lngScale: number = 1): number {
    const dLat = p2[0] - p1[0];
    const dLng = (p2[1] - p1[1]) * lngScale;
    return dLat * dLat + dLng * dLng;
}

/**
 * Calculate the distance between two points
 */
function getDistance(p1: LatLngTuple, p2: LatLngTuple): number {
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    return Math.sqrt(dLat * dLat + dLng * dLng);
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
 * Find the closest point on a polyline segment to a given point.
 * Returns the projected position and segment index.
 */
function snapToPolylineSegment(
    point: LatLngTuple,
    polyline: LatLngTuple[]
): { position: LatLngTuple; segmentIndex: number; t: number; angle: number } {
    if (polyline.length === 0) {
        return { position: point, segmentIndex: 0, t: 0, angle: 0 };
    }
    if (polyline.length === 1) {
        return { position: polyline[0], segmentIndex: 0, t: 0, angle: 0 };
    }

    // Scale longitude by cos(latitude) to account for Earth's curvature
    const latRad = (point[0] * Math.PI) / 180;
    const lngScale = Math.cos(latRad);

    let minDist = Infinity;
    let bestPosition: LatLngTuple = polyline[0];
    let bestSegmentIndex = 0;
    let bestT = 0;

    for (let i = 0; i < polyline.length - 1; i++) {
        const A = polyline[i];
        const B = polyline[i + 1];

        // Project point onto segment
        const AP = [point[0] - A[0], point[1] - A[1]];
        const AB = [B[0] - A[0], B[1] - A[1]];
        const ab2 = AB[0] * AB[0] + AB[1] * AB[1];

        let t = 0;
        if (ab2 > 0) {
            const dot = AP[0] * AB[0] + AP[1] * AB[1];
            t = Math.max(0, Math.min(1, dot / ab2));
        }

        const proj: LatLngTuple = [A[0] + AB[0] * t, A[1] + AB[1] * t];
        const dist = getSquaredDistance(point, proj, lngScale);

        if (dist < minDist) {
            minDist = dist;
            bestPosition = proj;
            bestSegmentIndex = i;
            bestT = t;
        }
    }

    const A = polyline[bestSegmentIndex];
    const B = polyline[bestSegmentIndex + 1] || A;
    const angle = getBearing(A, B);

    return { position: bestPosition, segmentIndex: bestSegmentIndex, t: bestT, angle };
}

/**
 * Build a path along the polyline from start to end position
 */
function buildPolylinePath(
    polyline: LatLngTuple[],
    startPos: LatLngTuple,
    startSegIdx: number,
    endPos: LatLngTuple,
    endSegIdx: number
): LatLngTuple[] {
    const path: LatLngTuple[] = [startPos];

    if (startSegIdx === endSegIdx) {
        // Same segment - just go directly
        path.push(endPos);
        return path;
    }

    const forward = endSegIdx > startSegIdx;

    if (forward) {
        // Go forward through vertices
        for (let i = startSegIdx + 1; i <= endSegIdx; i++) {
            path.push(polyline[i]);
        }
    } else {
        // Go backward through vertices
        for (let i = startSegIdx; i > endSegIdx; i--) {
            path.push(polyline[i]);
        }
    }

    path.push(endPos);
    return path;
}

/**
 * Interpolate position along a path based on progress (0-1)
 */
function interpolateAlongPath(
    path: LatLngTuple[],
    progress: number
): { position: LatLngTuple; angle: number } {
    if (path.length === 0) {
        return { position: [0, 0], angle: 0 };
    }
    if (path.length === 1) {
        return { position: path[0], angle: 0 };
    }

    // Calculate cumulative distances
    const distances: number[] = [0];
    for (let i = 1; i < path.length; i++) {
        distances.push(distances[i - 1] + getDistance(path[i - 1], path[i]));
    }
    const totalDistance = distances[distances.length - 1];

    if (totalDistance === 0) {
        return { position: path[path.length - 1], angle: 0 };
    }

    const targetDistance = totalDistance * Math.max(0, Math.min(1, progress));

    // Find which segment we're on
    let segIdx = 0;
    for (let i = 1; i < distances.length; i++) {
        if (distances[i] >= targetDistance) {
            segIdx = i - 1;
            break;
        }
        segIdx = i - 1;
    }

    const segStart = distances[segIdx];
    const segEnd = distances[segIdx + 1] || segStart;
    const segLen = segEnd - segStart;

    let t = 0;
    if (segLen > 0) {
        t = (targetDistance - segStart) / segLen;
    }

    const p1 = path[segIdx];
    const p2 = path[segIdx + 1] || p1;

    const position: LatLngTuple = [
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t,
    ];

    const angle = getBearing(p1, p2);

    return { position, angle };
}

/**
 * Smoothly interpolate rotation angle, handling the 360° wrap-around
 */
function interpolateAngle(from: number, to: number, progress: number): number {
    from = ((from % 360) + 360) % 360;
    to = ((to % 360) + 360) % 360;

    let diff = to - from;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return ((from + diff * progress) + 360) % 360;
}

/**
 * Easing function for smooth animation (ease-out cubic)
 */
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Hook that provides smooth animated position transitions along a polyline.
 * The bus marker will always stay on the polyline during animation.
 */
export function useAnimatedPosition(
    targetPosition: LatLngTuple,
    targetAngle: number,
    options: UseAnimatedPositionOptions = {}
): AnimatedPositionState {
    const { duration = MAP_SETTINGS.ANIMATION.BUS_MOVE_MS, polyline = [], snapToPolyline: shouldSnap = true } = options;

    // Current animated state
    const [state, setState] = useState<AnimatedPositionState>(() => {
        // Initialize with snapped position
        if (shouldSnap && polyline.length >= 2) {
            const snapped = snapToPolylineSegment(targetPosition, polyline);
            return { position: snapped.position, angle: targetAngle };
        }
        return { position: targetPosition, angle: targetAngle };
    });

    // Animation refs - stable across renders
    const animationRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);

    // Store previous target to detect changes
    const prevTargetRef = useRef<LatLngTuple>(targetPosition);

    // Store current position for animation start (separate from React state)
    const currentPosRef = useRef<LatLngTuple>(targetPosition);
    const currentAngleRef = useRef<number>(targetAngle);

    // Store animation path - this is the key to smooth animation
    const animationPathRef = useRef<LatLngTuple[]>([]);
    const animationStartTimeRef = useRef<number>(0);
    const animationStartAngleRef = useRef<number>(targetAngle);
    const animationEndAngleRef = useRef<number>(targetAngle);
    const animationEndPosRef = useRef<LatLngTuple>(targetPosition);

    useEffect(() => {
        const hasPolyline = polyline.length >= 2;

        // First render - set initial position
        if (isFirstRender.current) {
            isFirstRender.current = false;

            let initPos: LatLngTuple;
            if (shouldSnap && hasPolyline) {
                const snapped = snapToPolylineSegment(targetPosition, polyline);
                initPos = snapped.position;
            } else {
                initPos = targetPosition;
            }

            currentPosRef.current = initPos;
            currentAngleRef.current = targetAngle;
            setState({ position: initPos, angle: targetAngle });
            prevTargetRef.current = targetPosition;
            return;
        }

        // Check if target position actually changed
        const prev = prevTargetRef.current;
        if (targetPosition[0] === prev[0] && targetPosition[1] === prev[1]) {
            // Position didn't change, just update angle directly
            currentAngleRef.current = targetAngle;
            setState(s => ({ ...s, angle: targetAngle }));
            return;
        }

        // Cancel any ongoing animation
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        prevTargetRef.current = targetPosition;

        // Get starting position (use ref, not state, to avoid stale closure)
        const startPos = currentPosRef.current;
        const startAngle = currentAngleRef.current;

        // Calculate animation path
        let path: LatLngTuple[];
        let endPos: LatLngTuple;
        let endAngle: number;

        if (shouldSnap && hasPolyline) {
            // Get current position snapped to polyline
            const startSnapped = snapToPolylineSegment(startPos, polyline);
            const endSnapped = snapToPolylineSegment(targetPosition, polyline);

            path = buildPolylinePath(
                polyline,
                startSnapped.position,
                startSnapped.segmentIndex,
                endSnapped.position,
                endSnapped.segmentIndex
            );
            endPos = endSnapped.position;
            endAngle = endSnapped.angle;
        } else {
            // Simple linear path
            path = [startPos, targetPosition];
            endPos = targetPosition;
            endAngle = targetAngle;
        }

        // Store animation parameters
        animationPathRef.current = path;
        animationStartTimeRef.current = performance.now();
        animationStartAngleRef.current = startAngle;
        animationEndAngleRef.current = endAngle;
        animationEndPosRef.current = endPos;

        // Animation loop
        const tick = (currentTime: number) => {
            const elapsed = currentTime - animationStartTimeRef.current;
            const rawProgress = Math.min(elapsed / duration, 1);
            const progress = easeOutCubic(rawProgress);

            const pathResult = interpolateAlongPath(animationPathRef.current, progress);
            const angle = interpolateAngle(
                animationStartAngleRef.current,
                animationEndAngleRef.current,
                progress
            );

            // Update refs immediately
            currentPosRef.current = pathResult.position;
            currentAngleRef.current = angle;

            setState({
                position: pathResult.position,
                angle: angle,
            });

            if (rawProgress < 1) {
                animationRef.current = requestAnimationFrame(tick);
            } else {
                // Animation complete - ensure we end exactly at target
                currentPosRef.current = animationEndPosRef.current;
                currentAngleRef.current = animationEndAngleRef.current;
                setState({
                    position: animationEndPosRef.current,
                    angle: animationEndAngleRef.current,
                });
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(tick);

        // Cleanup
        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
        // IMPORTANT: Don't include state in dependencies to avoid re-triggering during animation
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetPosition[0], targetPosition[1], targetAngle, duration, polyline, shouldSnap]);

    return state;
}