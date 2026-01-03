// src/features/schedule/utils/data.ts

import { DATA_SOURCE } from '@core/constants/env';
import { ERROR_MESSAGES } from '@core/constants/locale';

import { BusData } from '@schedule/models/bus';

// Cache for parsed bus data
const dataCache = new Map<string, BusData>();
let routeListCache: BusData[] | null = null;
let availableRouteIds: string[] | null = null;

/**
 * Build URL for data based on remote/local mode
 */
function getDataUrl(pathParam: string, isRouteData: boolean): string {
    if (DATA_SOURCE.USE_REMOTE && DATA_SOURCE.BASE_URL) {
        // Remote: cloudfront.net/schedules/{routeId}.json or cloudfront.net/routeMap.json
        const remotePath = isRouteData ? `${DATA_SOURCE.PATHS.SCHEDULES}/${pathParam}` : pathParam;
        return `${DATA_SOURCE.BASE_URL}/${remotePath}`;
    }
    // Local: /data/schedules/{routeId}.json or /data/routeMap.json
    const subDir = isRouteData ? 'data/schedules' : 'data';
    return `/${subDir}/${pathParam}`;
}

/**
 * Fetch data from remote URL or local fallback
 */
async function fetchData<T>(pathParam: string, isRouteData: boolean = false): Promise<T | null> {
    try {
        const url = getDataUrl(pathParam, isRouteData);
        const response = await fetch(url, {
            next: { revalidate: DATA_SOURCE.CACHE_REVALIDATE }
        });

        if (!response.ok) throw new Error(ERROR_MESSAGES.REMOTE_FETCH_FAILED(response.status));

        return await response.json() as T;
    } catch (error) {
        console.error(ERROR_MESSAGES.DATA_FETCH_ERROR(pathParam), error);
        return null;
    }
}

/**
 * Get available route IDs from route map
 */
async function getAvailableRouteIds(): Promise<string[]> {
    if (availableRouteIds) {
        return availableRouteIds;
    }

    const routeMap = await fetchData<{ routes: Record<string, string[]> }>(DATA_SOURCE.PATHS.ROUTE_MAP, false);

    if (routeMap?.routes) {
        availableRouteIds = Object.keys(routeMap.routes);
        return availableRouteIds;
    }

    // Fallback to empty array
    availableRouteIds = [];
    return availableRouteIds;
}

/**
 * Load and parse a single route with caching
 */
export async function getRouteData(routeId: string): Promise<BusData | null> {
    if (dataCache.has(routeId)) {
        return dataCache.get(routeId)!;
    }

    // Validate route ID exists in route map before fetching
    const validRoutes = await getAvailableRouteIds();
    if (!validRoutes.includes(routeId)) {
        return null;
    }

    const data = await fetchData<BusData>(`${routeId}.json`, true);

    if (data) {
        dataCache.set(routeId, data);
    }

    return data;
}

/**
 * Get all routes with caching
 */
export async function getAllRoutes(): Promise<BusData[]> {
    if (routeListCache) {
        return routeListCache;
    }

    const routeIds = await getAvailableRouteIds();
    const results = await Promise.allSettled(
        routeIds.map(id => getRouteData(id))
    );

    routeListCache = results
        .filter((result): result is PromiseFulfilledResult<BusData | null> =>
            result.status === 'fulfilled'
        )
        .map(result => result.value)
        .filter((value): value is BusData => value !== null);

    return routeListCache;
}

/**
 * Get all route IDs for static generation
 */
export async function getAllRouteIds(): Promise<string[]> {
    return await getAvailableRouteIds();
}

/**
 * Check if a route exists
 */
export async function routeExists(routeId: string): Promise<boolean> {
    const data = await getRouteData(routeId);
    return data !== null;
}
