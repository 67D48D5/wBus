// src/features/map/hooks/useAnimatedPosition.ts

"use client";

import { useRef, useState, useEffect } from "react";
import { MAP_SETTINGS } from "@core/config/env";

import type { LatLngTuple } from "leaflet";

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

interface AnimatedPositionState {
    position: LatLngTuple;
    angle: number;
}

interface UseAnimatedPositionOptions {
    /** Animation duration in ms. Defaults to global setting. */
    duration?: number;
    /** The route path to snap the marker to. */
    polyline?: LatLngTuple[];
    /** If true, the marker is projected onto the polyline. */
    snapToPolyline?: boolean;
    /** Forces an immediate re-sync when the key changes (e.g. route change). */
    resetKey?: string | number;
}

const BACKWARD_T_EPSILON = 1e-3;
const BACKWARD_JITTER_METERS = 12;

// ----------------------------------------------------------------------
// Math Helpers (Pure Functions)
// ----------------------------------------------------------------------

/**
 * Calculates squared distance between two points.
 * Faster than standard distance (no sqrt) for comparisons.
 * @param lngScale - Correction factor for longitude based on latitude (cos(lat)).
 */
function getSquaredDistance(p1: LatLngTuple, p2: LatLngTuple, lngScale: number = 1): number {
    const dLat = p2[0] - p1[0];
    const dLng = (p2[1] - p1[1]) * lngScale;
    return dLat * dLat + dLng * dLng;
}

/**
 * Calculates standard Euclidean distance between two lat/lng points.
 */
function getDistance(p1: LatLngTuple, p2: LatLngTuple): number {
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Approximates distance in meters using a spherical earth model.
 * Sufficient for jitter threshold checks.
 */
function getApproxDistanceMeters(p1: LatLngTuple, p2: LatLngTuple): number {
    const latRad = ((p1[0] + p2[0]) * 0.5 * Math.PI) / 180;
    const lngScale = Math.cos(latRad);
    const distDeg = Math.sqrt(getSquaredDistance(p1, p2, lngScale));
    return distDeg * 111_000; // ~111km per degree
}

/**
 * Calculates the bearing (angle in degrees) from one point to another.
 * Normalized to 0-360 degrees.
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
 * Projects a point onto the nearest segment of a polyline.
 * 
 * * @param point - The raw GPS point (which might be slightly off-road).
 * @param polyline - The route path.
 * @returns The projected point, segment index, and progress along that segment (t).
 */
function snapToPolylineSegment(
    point: LatLngTuple,
    polyline: LatLngTuple[]
): { position: LatLngTuple; segmentIndex: number; t: number; angle: number } {
    if (polyline.length === 0) return { position: point, segmentIndex: 0, t: 0, angle: 0 };
    if (polyline.length === 1) return { position: polyline[0], segmentIndex: 0, t: 0, angle: 0 };

    // Scale longitude to account for Earth's curvature at this latitude
    const latRad = (point[0] * Math.PI) / 180;
    const lngScale = Math.cos(latRad);

    let minDist = Infinity;
    let bestPosition: LatLngTuple = polyline[0];
    let bestSegmentIndex = 0;
    let bestT = 0;

    // Iterate all segments to find the closest projection
    for (let i = 0; i < polyline.length - 1; i++) {
        const A = polyline[i];
        const B = polyline[i + 1];

        // Vector AP (Start -> Point) and AB (Start -> End)
        const AP = [point[0] - A[0], point[1] - A[1]];
        const AB = [B[0] - A[0], B[1] - A[1]];
        const ab2 = AB[0] * AB[0] + AB[1] * AB[1];

        // Project AP onto AB to find 't' (0 to 1)
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

    // Calculate angle of the specific segment we snapped to
    const A = polyline[bestSegmentIndex];
    const B = polyline[bestSegmentIndex + 1] || A;
    const angle = getBearing(A, B);

    return { position: bestPosition, segmentIndex: bestSegmentIndex, t: bestT, angle };
}

/**
 * Detects if the new position is "behind" the previous position along the path.
 */
function isBackwardProgress(
    startSegIdx: number,
    startT: number,
    endSegIdx: number,
    endT: number
): boolean {
    if (endSegIdx < startSegIdx) return true;
    if (endSegIdx > startSegIdx) return false;
    // Same segment: check if t decreased significantly
    return endT < startT - BACKWARD_T_EPSILON;
}

/**
 * Constructs the animation path along the polyline.
 * Handles "backward" data by snapping instead of animating reverse.
 */
function buildPolylinePath(
    polyline: LatLngTuple[],
    startPos: LatLngTuple,
    startSegIdx: number,
    endPos: LatLngTuple,
    endSegIdx: number
): LatLngTuple[] {
    const path: LatLngTuple[] = [startPos];

    // Case 1: Same segment - direct line
    if (startSegIdx === endSegIdx) {
        path.push(endPos);
        return path;
    }

    const isForward = endSegIdx > startSegIdx;

    if (isForward) {
        // Case 2: Forward - Add all intermediate vertices
        for (let i = startSegIdx + 1; i <= endSegIdx; i++) {
            path.push(polyline[i]);
        }
        path.push(endPos);
    } else {
        // Case 3: Backward - Do not animate backward. Just snap to new pos.
        path.push(endPos);
    }

    return path;
}

/**
 * Interpolates position and angle at a specific progress (0.0 to 1.0) along a multi-segment path.
 */
function interpolateAlongPath(
    path: LatLngTuple[],
    progress: number
): { position: LatLngTuple; angle: number } {
    if (path.length === 0) return { position: [0, 0], angle: 0 };
    if (path.length === 1) return { position: path[0], angle: 0 };

    // 1. Calculate total length
    const distances: number[] = [0];
    for (let i = 1; i < path.length; i++) {
        distances.push(distances[i - 1] + getDistance(path[i - 1], path[i]));
    }
    const totalDistance = distances[distances.length - 1];

    if (totalDistance === 0) return { position: path[path.length - 1], angle: 0 };

    // 2. Find target distance
    const targetDistance = totalDistance * Math.max(0, Math.min(1, progress));

    // 3. Find active segment
    let segIdx = 0;
    for (let i = 1; i < distances.length; i++) {
        if (distances[i] >= targetDistance) {
            segIdx = i - 1;
            break;
        }
        segIdx = i - 1;
    }

    // 4. Interpolate within segment
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
 * Smoothly interpolates angles, correctly handling the 359 -> 0 degree wrap-around.
 */
function interpolateAngle(from: number, to: number, progress: number): number {
    from = ((from % 360) + 360) % 360;
    to = ((to % 360) + 360) % 360;

    let diff = to - from;
    // Take the shortest path (e.g., 350 -> 10 is +20, not -340)
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return ((from + diff * progress) + 360) % 360;
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

// ----------------------------------------------------------------------
// Hook Definition
// ----------------------------------------------------------------------

/**
 * Hook to animate a marker's position smoothly.
 * Supports snapping the marker to a polyline path for realistic vehicle movement.
 */
export function useAnimatedPosition(
    targetPosition: LatLngTuple,
    targetAngle: number,
    options: UseAnimatedPositionOptions = {}
): AnimatedPositionState {
    const {
        duration = MAP_SETTINGS.ANIMATION.BUS_MOVE_MS,
        polyline = [],
        snapToPolyline: shouldSnap = true,
        resetKey,
    } = options;

    // State
    const [state, setState] = useState<AnimatedPositionState>(() => {
        // Initial state: Snap immediately if data is available
        if (shouldSnap && polyline.length >= 2) {
            const snapped = snapToPolylineSegment(targetPosition, polyline);
            return { position: snapped.position, angle: targetAngle };
        }
        return { position: targetPosition, angle: targetAngle };
    });

    // Refs (Mutable values for animation loop)
    const animationRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);
    const prevTargetRef = useRef<LatLngTuple>(targetPosition);

    // The "Current" visual state (updated every frame)
    const currentPosRef = useRef<LatLngTuple>(targetPosition);
    const currentAngleRef = useRef<number>(targetAngle);

    // Animation Path Data
    const animationPathRef = useRef<LatLngTuple[]>([]);
    const animationStartTimeRef = useRef<number>(0);
    const animationStartAngleRef = useRef<number>(targetAngle);
    const animationEndAngleRef = useRef<number>(targetAngle);
    const animationEndPosRef = useRef<LatLngTuple>(targetPosition);
    const resetKeyRef = useRef<string | number | undefined>(resetKey);

    useEffect(() => {
        if (resetKeyRef.current === resetKey) return;
        resetKeyRef.current = resetKey;

        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        const hasPolyline = polyline.length >= 2;
        let nextPos = targetPosition;
        let nextAngle = targetAngle;

        if (shouldSnap && hasPolyline) {
            const snapped = snapToPolylineSegment(targetPosition, polyline);
            nextPos = snapped.position;
            nextAngle = snapped.angle;
        }

        currentPosRef.current = nextPos;
        currentAngleRef.current = nextAngle;
        prevTargetRef.current = targetPosition;
        setState({ position: nextPos, angle: nextAngle });
    }, [resetKey, targetPosition, targetAngle, polyline, shouldSnap]);

    useEffect(() => {
        const hasPolyline = polyline.length >= 2;

        // 1. First Render Initialization
        if (isFirstRender.current) {
            isFirstRender.current = false;
            let initPos: LatLngTuple = targetPosition;

            if (shouldSnap && hasPolyline) {
                const snapped = snapToPolylineSegment(targetPosition, polyline);
                initPos = snapped.position;
            }

            currentPosRef.current = initPos;
            currentAngleRef.current = targetAngle;
            setState({ position: initPos, angle: targetAngle });
            prevTargetRef.current = targetPosition;
            return;
        }

        // 2. Check if update is needed
        const prev = prevTargetRef.current;
        const isSamePosition = targetPosition[0] === prev[0] && targetPosition[1] === prev[1];

        if (isSamePosition) {
            // Only angle changed? Update immediately (buses rotate in place rarely, usually moving)
            currentAngleRef.current = targetAngle;
            setState(s => ({ ...s, angle: targetAngle }));
            return;
        }

        // 3. Prepare Animation
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
        }
        prevTargetRef.current = targetPosition;

        const startPos = currentPosRef.current;
        const startAngle = currentAngleRef.current;

        let path: LatLngTuple[];
        let endPos: LatLngTuple;
        let endAngle: number;

        // 4. Calculate Path (Linear or Polyline-Snapped)
        if (shouldSnap && hasPolyline) {
            const startSnapped = snapToPolylineSegment(startPos, polyline);
            const endSnapped = snapToPolylineSegment(targetPosition, polyline);

            // Check for illegal backward movement (GPS jitter)
            const isBackward = isBackwardProgress(
                startSnapped.segmentIndex,
                startSnapped.t,
                endSnapped.segmentIndex,
                endSnapped.t
            );

            if (isBackward) {
                const backMeters = getApproxDistanceMeters(startSnapped.position, endSnapped.position);

                // Small jitter? Ignore update.
                if (backMeters <= BACKWARD_JITTER_METERS) {
                    return;
                }

                // Large jump backward? Snap immediately (teleport).
                currentPosRef.current = endSnapped.position;
                currentAngleRef.current = endSnapped.angle;
                setState({ position: endSnapped.position, angle: endSnapped.angle });
                return;
            }

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
            // Direct interpolation
            path = [startPos, targetPosition];
            endPos = targetPosition;
            endAngle = targetAngle;
        }

        // 5. Start Animation Loop
        animationPathRef.current = path;
        animationStartTimeRef.current = performance.now();
        animationStartAngleRef.current = startAngle;
        animationEndAngleRef.current = endAngle;
        animationEndPosRef.current = endPos;

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

            currentPosRef.current = pathResult.position;
            currentAngleRef.current = angle;

            setState({
                position: pathResult.position,
                angle: angle,
            });

            if (rawProgress < 1) {
                animationRef.current = requestAnimationFrame(tick);
            } else {
                // Ensure final frame is exact
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

        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
        // Dependency array explicitly excludes state to avoid loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetPosition[0], targetPosition[1], targetAngle, duration, polyline, shouldSnap]);

    return state;
}
