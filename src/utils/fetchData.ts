// src/utils/fetchBusData.ts

const API_URL = "https://gl87xfcx95.execute-api.ap-northeast-2.amazonaws.com";

export async function fetchBusLocationData(routeId: string) {
  const response = await fetch(`${API_URL}/getBusLocation/${routeId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  const items = data.response?.body?.items?.item;
  if (!items) {
    return [];
  }

  return items;
}

export async function fetchBusStopLocationData(routeId: string) {
  const response = await fetch(`${API_URL}/getBusStopLocation/${routeId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  const items = data.response?.body?.items?.item;
  if (!items) {
    return [];
  }

  return items;
}

export async function fetchBusArrivalInfoData(busStopId: string) {
  const response = await fetch(`${API_URL}/getBusArrivalInfo/${busStopId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  const rawItem = data.response?.body?.items?.item;

  if (!rawItem) {
    return [];
  }

  const items = Array.isArray(rawItem) ? rawItem : [rawItem];
  return items;
}
