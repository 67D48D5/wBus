// src/utils/getRouteNameFromId.ts

import routeIds from "@/../public/routeIds.json";

/**
 * 특정 routeId(WJB25...)에 해당하는 노선 번호(routeName)를 반환합니다.
 * 예: "WJB251000068" => "30"
 */
export function getRouteNameFromId(routeId: string): string | null {
  for (const [name, ids] of Object.entries(routeIds)) {
    if (ids.includes(routeId)) return name;
  }
  return null;
}
