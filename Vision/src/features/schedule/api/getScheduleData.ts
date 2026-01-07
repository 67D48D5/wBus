// src/features/schedule/api/getScheduleData.ts

import { fetchAPI } from '@core/api/fetchAPI';

import { DATA_SOURCE } from '@core/constants/env';
import { ERROR_MESSAGES } from '@core/constants/locale';

import { BusData } from '@schedule/models/schedule';

import { promises as fs } from 'fs';
import path from 'path';

// Notice type definition
export interface Notice {
    id: string;
    type: 'info' | 'warning' | 'urgent';
    title: string;
    message: string;
    date: string;
}

// Cache for parsed bus data
const dataCache = new Map<string, BusData>();

// Cache for route list
let routeListCache: BusData[] | null = null;
let availableRouteIds: string[] | null = null;
let noticeCache: Notice[] | null = null;

/**
 * Build URL for remote data or local file path
 */
function getDataSource(pathParam: string, isRouteData: boolean): { isRemote: boolean; location: string } {
    if (DATA_SOURCE.USE_REMOTE && DATA_SOURCE.BASE_URL) {
        // Remote: cloudfront.net/schedules/{routeId}.json or cloudfront.net/routeMap.json
        const remotePath = isRouteData ? `${DATA_SOURCE.PATHS.SCHEDULES}/${pathParam}` : pathParam;
        return { isRemote: true, location: `${DATA_SOURCE.BASE_URL}/${remotePath}` };
    }
    // Local: public/data/schedules/{routeId}.json or public/data/routeMap.json
    const subDir = isRouteData ? 'data/schedules' : 'data';
    return { isRemote: false, location: path.join(process.cwd(), 'public', subDir, pathParam) };
}

/**
 * Fetch data from remote URL or read from local file system
 */
async function fetchData<T>(pathParam: string, isRouteData: boolean = false): Promise<T | null> {
    try {
        const { isRemote, location } = getDataSource(pathParam, isRouteData);

        if (isRemote) {
            return await fetchAPI<T>(location, {
                baseUrl: '', // location is already a full URL
                init: { next: { revalidate: DATA_SOURCE.CACHE_REVALIDATE } }
            });
        } else {
            // Server-side: read directly from file system
            const fileContent = await fs.readFile(location, 'utf8');
            return JSON.parse(fileContent) as T;
        }
    } catch (error) {
        if ((error as any).code === 'ENOENT') {
            return null;
        }
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

    const routeMap = await fetchData<{ route_numbers: Record<string, string[]> }>(DATA_SOURCE.PATHS.ROUTE_MAP, false);

    if (routeMap?.route_numbers) {
        availableRouteIds = Object.keys(routeMap.route_numbers);
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

/**
 * Get notices from notice.json
 */
export async function getNotices(): Promise<Notice[]> {
    if (noticeCache) {
        return noticeCache;
    }

    const data = await fetchData<{ notices: Notice[] }>('notice.json', false);

    if (data?.notices) {
        noticeCache = data.notices;
        return noticeCache;
    }

    return [];
}
