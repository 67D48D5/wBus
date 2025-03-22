// src/utils/getRouteMap.ts

let cache: Record<string, string[]> | null = null;
let pending: Promise<Record<string, string[]>> | null = null;

export async function getRouteMap(): Promise<Record<string, string[]>> {
  if (cache) return cache;
  if (pending) return pending;

  pending = fetch("/routeMap.json")
    .then((res) => {
      if (!res.ok) throw new Error("🚫 routeMap.json 요청 실패");
      return res.json();
    })
    .then((json) => {
      cache = json;
      return json;
    })
    .catch((err) => {
      console.error("❌ routeMap.json fetch error:", err);
      throw err;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}
