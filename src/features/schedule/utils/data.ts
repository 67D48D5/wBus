// src/features/schedule/utils/data.ts

import { BusData } from '@schedule/models/bus';
import { DATA_SOURCE } from '@core/constants/env';

import { promises as fs } from 'fs';
import path from 'path';

// Cache for parsed bus data
const dataCache = new Map<string, BusData>();
let routeListCache: BusData[] | null = null;
let availableRouteIds: string[] | null = null;

/**
 * Fetch data from remote URL or local fallback
 */
async function fetchData<T>(pathParam: string, isRouteData: boolean = false): Promise<T | null> {
    try {
        if (DATA_SOURCE.USE_REMOTE && DATA_SOURCE.BASE_URL) {
            // Fetch from remote (S3, CDN, etc.)
            // S3 structure: scheduleRouteMap.json at root, route data under data/schedules/
            const remotePath = isRouteData ? `data/schedules/${pathParam}` : pathParam;
            const url = `${DATA_SOURCE.BASE_URL}/${remotePath}`;
            const response = await fetch(url, {
                next: { revalidate: DATA_SOURCE.CACHE_REVALIDATE }
            });

            if (!response.ok) throw new Error(`Remote fetch failed: ${response.status}`);

            return await response.json() as T;
        } else {
            // Local structure: scheduleRouteMap.json in public/, route data in public/data/schedules/
            const subDir = isRouteData ? 'data/schedules' : '';
            const filePath = path.join(process.cwd(), 'public', subDir, pathParam);
            const fileContent = await fs.readFile(filePath, 'utf8');

            return JSON.parse(fileContent) as T;
        }
    } catch (error) {
        console.error(`Error fetching data from ${pathParam}:`, error);
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

    const routeMap = await fetchData<{ routes: Record<string, string[]> }>(DATA_SOURCE.ROUTE_MAP_PATH, false);

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
