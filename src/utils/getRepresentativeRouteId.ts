// src/utils/getRepresentativeRouteId.ts

import rawRouteIds from "@/../public/routeIds.json";

const routeIds = rawRouteIds as Record<string, string[]>;

export function getRepresentativeRouteId(routeName: string): string | null {
  const ids = routeIds[routeName];
  return ids?.[0] ?? null;
}
