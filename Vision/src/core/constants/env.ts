// src/core/constants/env.ts

import { APP_MESSAGES } from "./locale";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "wBus";
export const APP_SPLASH_MESSAGE =
  process.env.NEXT_PUBLIC_APP_SPLASH_MESSAGE ||
  APP_MESSAGES.LOADING_INFO;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "NOT_SET";
export const API_REFRESH_INTERVAL =
  Number(process.env.NEXT_PUBLIC_API_REFRESH_INTERVAL) || 3000;

export const MAP_URL =
  process.env.NEXT_PUBLIC_MAP_URL ||
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
  "&copy; OpenStreetMap Contributors";

export const MAP_MAX_BOUNDS = (() => {
  const raw = process.env.NEXT_PUBLIC_MAP_MAX_BOUNDS || "37.22,127.8,37.52,128.05";
  const [swLat, swLng, neLat, neLng] = raw.split(",").map(Number);
  return [
    [swLat, swLng],
    [neLat, neLng],
  ] as [[number, number], [number, number]];
})();

export const MAP_DEFAULT_POSITION = (() => {
  const raw =
    process.env.NEXT_PUBLIC_MAP_DEFAULT_POSITION || "37.28115,127.901946";
  const [lat, lng] = raw.split(",").map(Number);
  return [lat, lng] as [number, number];
})();

export const MAP_DEFAULT_ZOOM =
  Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM) || 16;
export const MAP_MIN_ZOOM =
  Number(process.env.NEXT_PUBLIC_MAP_MIN_ZOOM) || 12;
export const MAP_MAX_ZOOM =
  Number(process.env.NEXT_PUBLIC_MAP_MAX_ZOOM) || 19;

export const BUSSTOP_MARKER_MIN_ZOOM =
  Number(process.env.NEXT_PUBLIC_BUSSTOP_MARKER_MIN_ZOOM) || 16;

/** Duration of bus marker animation in milliseconds. Longer = smoother but more lag behind real-time data */
export const BUS_ANIMATION_DURATION =
  Number(process.env.NEXT_PUBLIC_BUS_ANIMATION_DURATION) || 4000;

/** Duration for map fly-to animation in seconds */
export const MAP_FLY_TO_DURATION =
  Number(process.env.NEXT_PUBLIC_MAP_FLY_TO_DURATION) || 1.5;

/** Zoom level when centering on user's location */
export const MY_LOCATION_ZOOM =
  Number(process.env.NEXT_PUBLIC_MY_LOCATION_ZOOM) || 17;

/** Duration for splash screen fade-out animation in milliseconds */
export const SPLASH_FADE_DURATION =
  Number(process.env.NEXT_PUBLIC_SPLASH_FADE_DURATION) || 500;

/**
 * Bus stop node IDs that should always be considered as upward direction
 * This is used for special cases where direction detection needs to be overridden
 */
export const ALWAYS_UPWARD_NODE_IDS =
  process.env.NEXT_PUBLIC_ALWAYS_UPWARD_NODE_IDS?.split(",") || [
    "WJB251036041",
  ];

// Day types - Configuration
export const DAY_TYPES = {
  WEEKDAY: 'weekday',
  WEEKEND: 'weekend',
} as const;

export type DayType = typeof DAY_TYPES[keyof typeof DAY_TYPES];

// Theme
export const THEME = {
  DARK: 'dark',
  LIGHT: 'light',
  ATTRIBUTE: 'class',
} as const;

export const THEME_ICONS = {
  [THEME.DARK]: '☀️',
  [THEME.LIGHT]: '🌙',
} as const;

// Locale
export const LOCALE = {
  KOREAN: 'ko',
} as const;

// Data Source Configuration
export const DATA_SOURCE = {
  // Static data is served from API_URL with CloudFront routing patterns:
  // - API_URL/routeMap.json
  // - API_URL/polylines/*.geojson
  // - API_URL/schedules/*.json
  BASE_URL: API_URL !== 'NOT_SET' ? API_URL : '',
  USE_REMOTE: process.env.NEXT_PUBLIC_USE_REMOTE_DATA === 'true',
  PATHS: {
    ROUTE_MAP: 'routeMap.json',
    POLYLINES: 'polylines',  // polylines/{routeId}.geojson
    SCHEDULES: 'schedules',  // schedules/{routeId}.json
  },
  CACHE_REVALIDATE: 3600, // 1 hour in seconds
} as const;
