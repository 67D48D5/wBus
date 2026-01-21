// src/features/map/api/getMapData.ts

import { CacheManager } from "@core/cache/CacheManager";
import { fetchAPI } from "@core/network/fetchAPI";
import { APP_CONFIG, API_CONFIG } from "@core/config/env";
// @TODO: Define proper typing for map style JSON
const mapStyleCache = new CacheManager<any>();

/**
 * Build URL for map style data based on remote/local mode
 * Priority: 1. NEXT_PUBLIC_MAP_URL, 2. Remote Static Data, 3. Local Data 4. Default Fallback
 * @return {string} - The full URL to fetch the map style JSON
 */
export function getMapStyleUrl(): string {
    const { STATIC } = API_CONFIG;

    // [Highest Priority] If an explicit map style URL is set (for custom styles)
    // Example: NEXT_PUBLIC_MAP_URL="/map/style.json" or an external URL
    if (process.env.NEXT_PUBLIC_MAP_URL) {
        return process.env.NEXT_PUBLIC_MAP_URL;
    }

    // If the file path is not set, fall back to default
    const stylePath = STATIC.PATHS.MAP_STYLE || "config.json";

    // Remote mode (USE_REMOTE=true)
    if (STATIC.USE_REMOTE) {
        if (!STATIC.BASE_URL || STATIC.BASE_URL === "NOT_SET") {
            if (APP_CONFIG.IS_DEV) {
                console.warn("[getMapStyleUrl] 'STATIC_API_URL' is not set while USE_REMOTE is true. Falling back to default.");
            }
            return API_CONFIG.MAP_STYLE_FALLBACK;
        }
        // Use joinUrl utility to prevent duplicate slashes (defined in fetchAPI.ts)
        return joinUrl(STATIC.BASE_URL, stylePath);
    }

    // [Default] Local mode
    // If STATIC.BASE_URL is set to "/data", "/data/config.json" will be returned
    return joinUrl(STATIC.BASE_URL || "/data", stylePath);
}

/**
 * Fetches the custom map style JSON and applies localization logic.
 * This function caches the result to avoid redundant fetches.
 * @returns A promise that resolves to the modified map style JSON
 */
export async function getMapStyle(): Promise<any> {
    return await mapStyleCache.getOrFetch("mapStyle", async () => {
        // Fetch the style JSON (baseUrl is used as defined in MAP_SETTINGS)
        const style = await fetchAPI<any>(getMapStyleUrl(), { baseUrl: "" });

        return style;
    });
}

/**
 * URL assembly utility (removes duplicate slashes)
 */
function joinUrl(base: string, path: string): string {
    return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
