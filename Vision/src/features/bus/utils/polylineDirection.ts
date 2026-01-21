// src/features/bus/utils/polylineDirection.ts

import { snapToPolyline } from "@map/utils/polyUtils";

import type { RouteDetail } from "@core/domain/route";
import type { BusStop } from "@core/domain/station";

import type { LatLngTuple } from "leaflet";

const MAX_SAMPLE_STOPS = 20;
const SWAP_RATIO = 0.9;

function sampleStops(stops: LatLngTuple[]): LatLngTuple[] {
  if (stops.length <= MAX_SAMPLE_STOPS) return stops;

  const step = Math.ceil(stops.length / MAX_SAMPLE_STOPS);
  const sampled: LatLngTuple[] = [];

  for (let i = 0; i < stops.length; i += step) {
    sampled.push(stops[i]);
    if (sampled.length >= MAX_SAMPLE_STOPS) break;
  }

  return sampled;
}

function distanceToPolyline(point: LatLngTuple, polyline: LatLngTuple[]): number {
  const snapped = snapToPolyline(point as [number, number], polyline as [number, number][]);
  const dLat = point[0] - snapped.position[0];
  const dLng = point[1] - snapped.position[1];

  // Use degrees as a relative distance to avoid expensive conversions.
  return Math.hypot(dLat, dLng);
}

function averageDistance(stops: LatLngTuple[], polyline: LatLngTuple[]): number | null {
  if (stops.length === 0 || polyline.length < 2) return null;

  const total = stops.reduce((sum, stop) => sum + distanceToPolyline(stop, polyline), 0);
  return total / stops.length;
}

export function shouldSwapPolylines(
  routeDetail: RouteDetail | null,
  stationMap: Record<string, BusStop> | null,
  upPolyline: LatLngTuple[],
  downPolyline: LatLngTuple[]
): boolean {
  if (!routeDetail || !stationMap) return false;
  if (upPolyline.length < 2 || downPolyline.length < 2) return false;

  const upStops: LatLngTuple[] = [];
  const downStops: LatLngTuple[] = [];

  for (const stop of routeDetail.sequence) {
    const station = stationMap[stop.nodeid];
    if (!station) continue;

    const point: LatLngTuple = [station.gpslati, station.gpslong];
    if (stop.updowncd === 1) {
      upStops.push(point);
    } else if (stop.updowncd === 0) {
      downStops.push(point);
    }
  }

  if (upStops.length === 0 || downStops.length === 0) return false;

  const upSample = sampleStops(upStops);
  const downSample = sampleStops(downStops);

  const upToUp = averageDistance(upSample, upPolyline);
  const upToDown = averageDistance(upSample, downPolyline);
  const downToUp = averageDistance(downSample, upPolyline);
  const downToDown = averageDistance(downSample, downPolyline);

  if (
    upToUp === null ||
    upToDown === null ||
    downToUp === null ||
    downToDown === null
  ) {
    return false;
  }

  const upPrefersDown = upToDown < upToUp * SWAP_RATIO;
  const downPrefersUp = downToUp < downToDown * SWAP_RATIO;

  return upPrefersDown && downPrefersUp;
}
