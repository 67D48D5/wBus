// src/features/schedule/api/getScheduleData.ts

import { fetchAPI } from '@core/network/fetchAPI';
import { BusData } from '@core/domain/schedule';

import { API_CONFIG, APP_CONFIG } from '@core/config/env';
import { ERROR_MESSAGES } from '@core/config/locale';

import { promises as fs } from 'fs';
import path from 'path';

// Types & Interfaces
export interface Notice {
    id: string;
    type: 'info' | 'warning' | 'urgent';
    title: string;
    message: string;
    date: string;
}

// Parsed bus data cache
const dataCache = new Map<string, BusData>();

// Route list and notice caches
let routeListCache: BusData[] | null = null;
let availableRouteIds: string[] | null = null;
let noticeCache: Notice[] | null = null;

/**
 * Determine the server-side base URL for remote API fetching.
 * - In local development, if '/dev' (relative path) is set, it converts to the actual remote address (REMOTE_API_URL) for server fetch.
 * - Without this function, server-side fetch with relative paths causes infinite loading due to unrecognized relative paths.
 */
function getServerBaseUrl(): string {
    const { BASE_URL } = API_CONFIG.STATIC;

    // When `BASE_URL` starts with a relative path like '/dev'
    if (BASE_URL && BASE_URL.startsWith('/')) {
        // If REMOTE_API_URL is set, use it; otherwise, fallback to BASE_URL (may cause issues)
        return process.env.REMOTE_API_URL || BASE_URL;
    }

    return BASE_URL || '';
}

/**
 * Generate the source (remote URL or local file path) for schedule data.
 */
function getScheduleDataSource(routeId: string): { isRemote: boolean; location: string } {
    // Remote mode
    if (API_CONFIG.STATIC.USE_REMOTE) {
        const baseUrl = getServerBaseUrl();
        // Remote: https://.../schedules/{routeId}.json
        return {
            isRemote: true,
            location: `${baseUrl}/${API_CONFIG.STATIC.PATHS.SCHEDULES}/${routeId}.json`
        };
    }

    // Local mode
    // Local: public/data/schedules/{routeId}.json
    return {
        isRemote: false,
        location: path.join(process.cwd(), 'public/data/schedules', `${routeId}.json`)
    };
}

/**
 * Fetch schedule data (Remote Fetch or Local File Read)
 */
async function fetchScheduleData(routeId: string): Promise<BusData | null> {
    try {
        const { isRemote, location } = getScheduleDataSource(routeId);

        if (isRemote) {
            return await fetchAPI<BusData>(location, {
                baseUrl: '', // location is already a complete URL, so baseUrl is empty
                init: { next: { revalidate: API_CONFIG.STATIC.CACHE_REVALIDATE } }
            });
        } else {
            // Server-side Local File Read
            const fileContent = await fs.readFile(location, 'utf8');
            return JSON.parse(fileContent) as BusData;
        }
    } catch (error) {
        // If the file does not exist (e.g., 404), return null
        if ((error as any).code === 'ENOENT') {
            return null;
        }
        if (APP_CONFIG.IS_DEV) {
            console.error(ERROR_MESSAGES.DATA_FETCH_ERROR(routeId), error);
        }
        return null;
    }
}

/**
 * Fetch notice data
 */
async function fetchNoticeData(): Promise<{ notices: Notice[] } | null> {
    try {
        if (API_CONFIG.STATIC.USE_REMOTE) {
            const baseUrl = getServerBaseUrl();
            const location = `${baseUrl}/notice.json`;

            return await fetchAPI<{ notices: Notice[] }>(location, {
                baseUrl: '',
                init: { next: { revalidate: API_CONFIG.STATIC.CACHE_REVALIDATE } }
            });
        } else {
            const location = path.join(process.cwd(), 'public/data', 'notice.json');
            const fileContent = await fs.readFile(location, 'utf8');
            return JSON.parse(fileContent) as { notices: Notice[] };
        }
    } catch (error) {
        if ((error as any).code === 'ENOENT') {
            return null;
        }
        if (APP_CONFIG.IS_DEV) {
            console.error(ERROR_MESSAGES.DATA_FETCH_ERROR('notice.json'), error);
        }
        return null;
    }
}

/**
 * Get available route IDs by scanning the local directory.
 * Removes dependency on routeMap.json and directly checks the file system.
 */
async function getAvailableRouteIds(): Promise<string[]> {
    if (availableRouteIds) {
        return availableRouteIds;
    }

    try {
        // Scan the public/data/schedules directory
        const schedulesDir = path.join(process.cwd(), 'public/data/schedules');
        const files = await fs.readdir(schedulesDir);

        availableRouteIds = files
            // Filter only .json files and remove the extension (exclude .keep files, etc.)
            .filter(file => file.endsWith('.json') && file !== '.keep')
            .map(file => file.replace('.json', ''));

        return availableRouteIds;
    } catch (error) {
        if (APP_CONFIG.IS_DEV) {
            console.error(ERROR_MESSAGES.DATA_FETCH_ERROR('getAvailableRouteIds'), error);
        }
        availableRouteIds = [];
        return availableRouteIds;
    }
}

/**
 * Load and parse a single route with caching
 */
export async function getRouteData(routeId: string): Promise<BusData | null> {
    if (dataCache.has(routeId)) {
        return dataCache.get(routeId)!;
    }

    const data = await fetchScheduleData(routeId);

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
 * Get all route IDs for static generation (Used in getStaticPaths)
 */
export async function getAllRouteIds(): Promise<string[]> {
    return await getAvailableRouteIds();
}

/**
 * Check if a route exists
 */
export async function routeExists(routeId: string): Promise<boolean> {
    const routeIds = await getAvailableRouteIds();
    return routeIds.includes(routeId);
}

/**
 * Get notices
 */
export async function getNotices(): Promise<Notice[]> {
    if (noticeCache) {
        return noticeCache;
    }

    const data = await fetchNoticeData();

    if (data?.notices) {
        noticeCache = data.notices;
        return noticeCache;
    }

    return [];
}