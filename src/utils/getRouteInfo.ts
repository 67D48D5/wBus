// src/utils/getRouteInfo.ts

import type { RouteInfo } from "@/types/data";

let cache: Record<string, string[]> | null = null;
let pending: Promise<Record<string, string[]>> | null = null;

/**
 * /public/routeMap.json을 가져오고 메모리에 캐싱
 */
export async function getRouteMap(): Promise<Record<string, string[]>> {
  if (cache) return cache;
  if (pending) return pending;

  pending = fetch("/routeMap.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error("🚫 routeMap.json 요청 실패");
      }
      return res.json();
    })
    .then((json: Record<string, string[]>) => {
      cache = json;
      return json;
    })
    .finally(() => {
      pending = null;
    });

  return pending!;
}

/**
 * routeName을 기반으로 RouteInfo 객체 반환
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
