// src/features/live/api/getRealtimeData.ts

import { fetchAPI } from "@core/api/fetchAPI";
import type { BusItem, BusStop, ArrivalInfo } from "@live/models/data";

/**
 * Fetches real-time bus location data for a specific route.
 * @param routeId - The ID of the route to fetch bus locations for
 * @returns A promise that resolves to an array of bus location items
 */
export async function getBusLocationData(routeId: string): Promise<BusItem[]> {
  const data = await fetchAPI<{
    response?: { body?: { items?: { item?: BusItem[] } } };
  }>(`/getBusLocation/${routeId}`);
  const items = data.response?.body?.items?.item;
  return items ?? [];
}

/**
 * Fetches bus stop location data for a specific route.
 * @param routeId - The ID of the route to fetch bus stop locations for
 * @returns A promise that resolves to an array of bus stop items
 */
export async function getBusStopLocationData(routeId: string): Promise<BusStop[]> {
  const data = await fetchAPI<{
    response?: { body?: { items?: { item?: BusStop[] } } };
  }>(`/getBusStopLocation/${routeId}`);
  const items = data.response?.body?.items?.item;
  return items ?? [];
}

/**
 * Fetches bus arrival information for a specific bus stop.
 * @param busStopId - The ID of the bus stop to fetch arrival information for
 * @returns A promise that resolves to an array of arrival information items
 */
export async function getBusArrivalInfoData(busStopId: string): Promise<ArrivalInfo[]> {
  const data = await fetchAPI<{
    response?: { body?: { items?: { item?: ArrivalInfo | ArrivalInfo[] } } };
  }>(`/getBusArrivalInfo/${busStopId}`);
  const rawItem = data.response?.body?.items?.item;
  if (!rawItem) {
    return [];
  }
  return Array.isArray(rawItem) ? rawItem : [rawItem];
}
