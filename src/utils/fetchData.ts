// src/utils/fetchData.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.");
}

/**
 * 재시도 가능한 공통 API 호출 함수
 * @param endpoint API 엔드포인트 (예: /getBusLocation/routeId)
 * @param retries 재시도 횟수 (기본값: 3)
 * @param retryDelay 재시도 간격 (밀리초, 기본값: 1000)
 * @returns JSON 파싱 결과
 */
async function fetchData(endpoint: string, retries = 3, retryDelay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // 마지막 재시도까지 실패하면 에러를 throw 합니다.
      if (i === retries - 1) {
        console.error("최종 네트워크 에러:", error);
        throw error;
      }
      console.warn(`네트워크 에러 발생, ${i + 1}번째 재시도 진행 중...`, error);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // Generic Error
  throw new Error("알 수 없는 네트워크 에러");
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
  return Array.isArray(rawItem) ? rawItem : [rawItem];
}
