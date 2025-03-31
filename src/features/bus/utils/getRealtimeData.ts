// src/utils/getRealtimeData.ts

import { fetchAPI } from "@bus/utils/fetchAPI";

export async function getBusLocationData(routeId: string) {
  const data = await fetchAPI(`/getBusLocation/${routeId}`);
  const items = data.response?.body?.items?.item;
  return items ?? [];
}

export async function getBusStopLocationData(routeId: string) {
  const data = await fetchAPI(`/getBusStopLocation/${routeId}`);
  const items = data.response?.body?.items?.item;
  return items ?? [];
}

export async function getBusArrivalInfoData(busStopId: string) {
  const data = await fetchAPI(`/getBusArrivalInfo/${busStopId}`);
  const rawItem = data.response?.body?.items?.item;
  if (!rawItem) {
    return [];
  }
  return Array.isArray(rawItem) ? rawItem : [rawItem];
}
