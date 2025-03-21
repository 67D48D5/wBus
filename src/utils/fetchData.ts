// src/utils/fetchBusData.ts

const API_URL = 'https://gl87xfcx95.execute-api.ap-northeast-2.amazonaws.com';

export async function fetchBusLocationData(routeId: string) {
  try {
    const response = await fetch(`${API_URL}/busLocation/${routeId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.body?.items?.item ?? [];
  } catch (error) {
    console.error('❌ Failed to fetch bus data:', error);
    return [];
  }
}

export async function fetchBusStopLocationData(routeId: string) {
    try {
      const response = await fetch(`${API_URL}/busStopLocation/${routeId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.response?.body?.items?.item ?? [];
    } catch (error) {
      console.error('❌ Failed to fetch bus data:', error);
      return [];
    }
  }