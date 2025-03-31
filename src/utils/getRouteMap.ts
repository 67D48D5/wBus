// src/utils/getRouteMap.ts

import type { RouteInfo } from "@/types/data";

let cache: Record<string, string[]> | null = null;
let pending: Promise<Record<string, string[]>> | null = null;

/**
 * /public/routeMap.json을 가져와 메모리에 캐싱합니다.
 *
 * @returns {Promise<Record<string, string[]>>} - routeMap 데이터
 * @throws {Error} - 요청 실패 시 에러 발생
 */
export async function getRouteMap(): Promise<Record<string, string[]>> {
  // 캐시가 존재하면 즉시 반환
  if (cache) return cache;

  // 요청 중인 경우, 해당 프로미스를 반환
  if (pending) return pending;

  // fetch 요청을 pending에 할당
  pending = fetch("/routeMap.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error("🚫 routeMap.json 요청 실패");
      }
      return res.json();
    })
    .then((json: Record<string, string[]>) => {
      cache = json; // 성공 시 캐싱
      return json;
    })
    .catch((err) => {
      console.error("❌ routeMap.json fetch error:", err);
      throw err; // 에러 재발행
    })
    .finally(() => {
      pending = null; // 요청 완료 후 pending 상태 해제
    });

  return pending;
}

/**
 * 주어진 routeName에 대한 RouteInfo 객체를 반환합니다.
 */
export async function getRouteInfo(
  routeName: string
): Promise<RouteInfo | null> {
  try {
    const map = await getRouteMap();
    const routeIds = map[routeName];

    if (!routeIds || routeIds.length === 0) {
      console.error(
        `❌ routeName '${routeName}'에 대한 routeId가 존재하지 않습니다.`
      );
      return null;
    }

    return {
      routeName,
      representativeRouteId: routeIds[0],
      vehicleRouteIds: routeIds,
    };
  } catch (err) {
    console.error("❌ getRouteInfo 내부 오류:", err);
    return null;
  }
}
