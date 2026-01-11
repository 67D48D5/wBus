// src/features/schedule/api/getScheduleData.ts

import { fetchAPI } from '@core/network/fetchAPI';

import { API_CONFIG } from '@core/config/env';
import { ERROR_MESSAGES } from '@core/config/locale';

import { BusData } from '@core/domain/schedule';

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
 * Build URL for schedule data
 */
function getScheduleDataSource(routeId: string): { isRemote: boolean; location: string } {
    if (API_CONFIG.STATIC.USE_REMOTE && API_CONFIG.STATIC.BASE_URL) {
        // Remote: cloudfront.net/schedules/{routeId}.json
        return { isRemote: true, location: `${API_CONFIG.STATIC.BASE_URL}/${API_CONFIG.STATIC.PATHS.SCHEDULES}/${routeId}.json` };
    }
    // Local: public/data/schedules/{routeId}.json
    return { isRemote: false, location: path.join(process.cwd(), 'public/data/schedules', `${routeId}.json`) };
}

/**
 * Fetch schedule data from remote URL or read from local file system
 */
async function fetchScheduleData(routeId: string): Promise<BusData | null> {
    try {
        const { isRemote, location } = getScheduleDataSource(routeId);

        if (isRemote) {
            return await fetchAPI<BusData>(location, {
                baseUrl: '', // location is already a full URL
                init: { next: { revalidate: API_CONFIG.STATIC.CACHE_REVALIDATE } }
            });
        } else {
            // Server-side: read directly from file system
            const fileContent = await fs.readFile(location, 'utf8');
            return JSON.parse(fileContent) as BusData;
        }
    } catch (error) {
        if ((error as any).code === 'ENOENT') {
            return null;
        }
        console.error(ERROR_MESSAGES.DATA_FETCH_ERROR(routeId), error);
        return null;
    }
}

/**
 * Get available route IDs by scanning schedules directory
 */
async function getAvailableRouteIds(): Promise<string[]> {
    if (availableRouteIds) {
        return availableRouteIds;
    }

    try {
        const schedulesDir = path.join(process.cwd(), 'public/data/schedules');
        const files = await fs.readdir(schedulesDir);

        availableRouteIds = files
            .filter(file => file.endsWith('.json') && file !== '.keep')
            .map(file => file.replace('.json', ''));

        return availableRouteIds;
    } catch (error) {
        console.error('Error reading schedules directory:', error);
        availableRouteIds = [];
        return availableRouteIds;
    }
}

/**
 * Fetch notice data
 */
async function fetchNoticeData(): Promise<{ notices: Notice[] } | null> {
    try {
        const location = API_CONFIG.STATIC.USE_REMOTE && API_CONFIG.STATIC.BASE_URL
            ? `${API_CONFIG.STATIC.BASE_URL}/notice.json`
            : path.join(process.cwd(), 'public/data', 'notice.json');

        if (API_CONFIG.STATIC.USE_REMOTE && API_CONFIG.STATIC.BASE_URL) {
            return await fetchAPI<{ notices: Notice[] }>(location, {
                baseUrl: '',
                init: { next: { revalidate: API_CONFIG.STATIC.CACHE_REVALIDATE } }
            });
        } else {
            const fileContent = await fs.readFile(location, 'utf8');
            return JSON.parse(fileContent) as { notices: Notice[] };
        }
    } catch (error) {
        if ((error as any).code === 'ENOENT') {
            return null;
        }
        console.error(ERROR_MESSAGES.DATA_FETCH_ERROR('notice.json'), error);
        return null;
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

    const data = await fetchNoticeData();

    if (data?.notices) {
        noticeCache = data.notices;
        return noticeCache;
    }

    return [];
}
