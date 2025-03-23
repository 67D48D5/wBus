// src/utils/fetchBusData.ts

const API_URL = "https://gl87xfcx95.execute-api.ap-northeast-2.amazonaws.com";

export async function fetchBusLocationData(routeId: string) {
  const response = await fetch(`${API_URL}/busLocation/${routeId}`, {
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
  const response = await fetch(`${API_URL}/busStopLocation/${routeId}`, {
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
