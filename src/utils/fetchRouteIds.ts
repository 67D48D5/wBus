// src/utils/fetchRouteIds.ts

let cachedRouteIds: Record<string, string[]> | null = null;

export async function fetchRouteIds(): Promise<Record<string, string[]>> {
  if (cachedRouteIds) return cachedRouteIds;

  try {
    const res = await fetch("/routeIds.json");
    if (!res.ok) throw new Error("Failed to fetch routeIds.json");

    const data = await res.json();
    cachedRouteIds = data;
    return data;
  } catch (err) {
    console.error("❌ routeIds.json fetch error:", err);
    return {};
  }
}