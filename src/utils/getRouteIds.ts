// src/utils/getRouteIds.ts

let cache: Record<string, string[]> | null = null;

export async function getRouteIds(): Promise<Record<string, string[]>> {
  if (cache) return cache;

  const res = await fetch("/routeIds.json");
  if (!res.ok) throw new Error("🚫 routeIds.json 요청 실패");

  const json = await res.json();
  cache = json;
  return json;
}
