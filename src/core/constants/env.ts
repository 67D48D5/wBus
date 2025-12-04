// src/core/constants/env.ts

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "wBus";
export const APP_SPLASH_MESSAGE =
  process.env.NEXT_PUBLIC_APP_SPLASH_MESSAGE ||
  "실시간 버스 정보를 불러오는 중...";

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
  Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM) || 12;
export const MAP_MIN_ZOOM =
  Number(process.env.NEXT_PUBLIC_MAP_MIN_ZOOM) || 12;
export const MAP_MAX_ZOOM =
  Number(process.env.NEXT_PUBLIC_MAP_MAX_ZOOM) || 19;

export const BUSSTOP_TARGET_NODE_IDS =
  process.env.NEXT_PUBLIC_BUSSTOP_TARGET_NODE_IDS?.split(",") || [
    "WJB251036041",
  ];
export const BUSSTOP_YONSEI_END_ROUTES =
  process.env.NEXT_PUBLIC_BUSSTOP_YONSEI_END_ROUTES?.split(",") || ["30", "34"];
export const BUSSTOP_MARKER_MIN_ZOOM =
  Number(process.env.NEXT_PUBLIC_BUSSTOP_MARKER_MIN_ZOOM) || 15;
