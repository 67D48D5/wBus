// src/utils/fetchBusData.ts

const API_URL = "https://gl87xfcx95.execute-api.ap-northeast-2.amazonaws.com";

/**
 * 공통 API 호출 함수
 * @param endpoint - API 엔드포인트 (예: /getBusLocation/routeId)
 * @returns JSON 파싱 결과
 */
async function fetchData(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export async function fetchBusLocationData(routeId: string) {
  const data = await fetchData(`/getBusLocation/${routeId}`);
  const items = data.response?.body?.items?.item;
  return items ?? [];
}

export async function fetchBusStopLocationData(routeId: string) {
  const data = await fetchData(`/getBusStopLocation/${routeId}`);
  const items = data.response?.body?.items?.item;
  return items ?? [];
}

export async function fetchBusArrivalInfoData(busStopId: string) {
  const data = await fetchData(`/getBusArrivalInfo/${busStopId}`);
  const rawItem = data.response?.body?.items?.item;
  if (!rawItem) {
    return [];
  }
  // 단일 객체와 배열 둘 다 처리
  return Array.isArray(rawItem) ? rawItem : [rawItem];
}
