// src/core/config/env.ts

import { APP_MESSAGES } from "@core/config/locale";

// =============================================================================
// Env Parsing Helpers
// =============================================================================

function getEnv(key: string | undefined, fallback: string): string {
  return key ?? fallback;
}

function getEnvNumber(key: string | undefined, fallback: number): number {
  const parsed = Number(key);
  return IsNaN(parsed) ? fallback : parsed;
}

function getEnvBoolean(key: string | undefined, fallback = false): boolean {
  if (key === undefined) return fallback;
  return ["true", "1", "yes", "y", "on"].includes(key.trim().toLowerCase());
}

function getEnvArray<T = string>(key: string | undefined, separator = ",", fallback: T[] = []): T[] {
  if (!key) return fallback;
  return key.split(separator).map((item) => item.trim()) as unknown as T[];
}

function getEnvBounds(key: string | undefined, fallbackRaw: string): [[number, number], [number, number]] {
  const raw = key || fallbackRaw;
  const [swLat, swLng, neLat, neLng] = raw.split(",").map(Number);
  return [
    [swLat, swLng],
    [neLat, neLng],
  ];
}

function IsNaN(value: number): boolean {
  return Number.isNaN(value);
}

// =============================================================================
// Configuration Groups
// =============================================================================

/**
 * Basic Application Settings
 */
export const APP_CONFIG = {
  APP_NAME: getEnv(process.env.NEXT_PUBLIC_APP_NAME, "wBus"),
  MAP_SPLASH_MESSAGE: getEnv(process.env.NEXT_PUBLIC_APP_SPLASH_MESSAGE, APP_MESSAGES.LOADING_INFO),
  IS_DEV: process.env.NODE_ENV === "development",
} as const;

/**
 * API and Network Settings
 */
const rawStaticApiUrl = getEnv(process.env.NEXT_PUBLIC_STATIC_API_URL, "NOT_SET");
const staticBaseUrl = rawStaticApiUrl !== "NOT_SET" ? rawStaticApiUrl.replace(/\/+$/, "") : "";
const useRemoteStaticData = getEnvBoolean(
  process.env.NEXT_PUBLIC_USE_REMOTE_STATIC_DATA,
  false // Default to local data unless explicitly set to true
);

export const API_CONFIG = {
  LIVE: {
    URL: getEnv(process.env.NEXT_PUBLIC_LIVE_API_URL, "NOT_SET"),
    REFRESH_INTERVAL: getEnvNumber(process.env.NEXT_PUBLIC_LIVE_API_REFRESH_INTERVAL, 3000),
  },
  STATIC: {
    BASE_URL: staticBaseUrl,
    USE_REMOTE: useRemoteStaticData,
    PATHS: {
      MAP_STYLE: `mapStyle.json`,
      ROUTE_MAP: `routeMap.json`,
      POLYLINES: `polylines`,
      SCHEDULES: `schedules`,
    },
    CACHE_REVALIDATE: 3600, // 1 hour
  },
  MAP_STYLE_FALLBACK_API_URL: getEnv(process.env.NEXT_PUBLIC_MAP_FALLBACK_API_URL, "https://tiles.openfreemap.org/styles/liberty"),
} as const;

/**
 * Map Settings (MapLibre/Mapbox)
 */
export const MAP_SETTINGS = {
  MAX_BOUNDS: getEnvBounds(process.env.NEXT_PUBLIC_MAP_MAX_BOUNDS, "37.22,127.8,37.52,128.05"),
  DEFAULT_POSITION: (() => {
    const raw = getEnv(process.env.NEXT_PUBLIC_MAP_DEFAULT_POSITION, "37.3421,127.91976");
    const [lat, lng] = raw.split(",").map(Number);
    return [lat, lng] as [number, number];
  })(),
  ZOOM: {
    DEFAULT: getEnvNumber(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM, 13),
    BUS_STOP_DISPLAY: getEnvNumber(process.env.NEXT_PUBLIC_BUS_STOP_MARKER_MIN_ZOOM, 16),
    MIN: getEnvNumber(process.env.NEXT_PUBLIC_MAP_MIN_ZOOM, 12),
    MAX: getEnvNumber(process.env.NEXT_PUBLIC_MAP_MAX_ZOOM, 19),
  },
  // Below settings are in milliseconds
  ANIMATION: {
    BUS_MOVE_DURATION: getEnvNumber(process.env.NEXT_PUBLIC_BUS_ANIMATION_DURATION, 4000),
    FLY_TO_DURATION: getEnvNumber(process.env.NEXT_PUBLIC_MAP_FLY_TO_DURATION, 1000),
  },
  BUS_MARKER: {
    MARQUEE_THRESHOLD: 3,
    LABEL_STYLE_ID: "bus-route-label-style",
    ICON_SIZE: [29, 43] as [number, number],
    ICON_ANCHOR: [14, 21] as [number, number],
    POPUP_ANCHOR: [0, -21] as [number, number],
  },
  // Node IDs of bus stops that should always be treated as upward direction
  ALWAYS_UPWARD_NODE_IDS: getEnvArray(process.env.NEXT_PUBLIC_ALWAYS_UPWARD_NODE_IDS, ","),
  // Set default route number
  DEFAULT_ROUTE: getEnv(process.env.NEXT_PUBLIC_DEFAULT_ROUTE, "30"),
} as const;

/**
 * UI & UX Settings
 */
export const UI_CONFIG = {
  SPLASH_FADE_DURATION: getEnvNumber(process.env.NEXT_PUBLIC_SPLASH_FADE_DURATION, 500),
} as const;

/**
 * Preference Keys for localStorage or other storage mechanisms
 */
export const PREFERENCE_KEYS = {
  SELECTED_ROUTE: "wbus_selected_route",
  MAP_VIEW: "wbus_map_view",
} as const;

/**
 * Common Constants (Fixed constants, not environment variables)
 */
export const DAY_TYPES = {
  WEEKDAY: 'weekday',
  WEEKEND: 'weekend',
} as const;

export type DayType = typeof DAY_TYPES[keyof typeof DAY_TYPES];
