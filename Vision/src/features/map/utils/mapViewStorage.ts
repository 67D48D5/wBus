// src/features/bus/utils/mapViewStorage.ts

import L from "leaflet";

import { APP_CONFIG, MAP_SETTINGS, STORAGE_KEYS } from "@core/config/env";

export type StoredMapView = {
  center: [number, number];
  zoom: number;
};

const DEFAULT_MAP_VIEW: StoredMapView = {
  center: MAP_SETTINGS.BOUNDS.DEFAULT_CENTER,
  zoom: MAP_SETTINGS.ZOOM.DEFAULT,
};

function clampZoom(zoom: number): number {
  return Math.min(MAP_SETTINGS.ZOOM.MAX, Math.max(MAP_SETTINGS.ZOOM.MIN, zoom));
}

export function getInitialMapView(): StoredMapView {
  return loadStoredMapView() ?? DEFAULT_MAP_VIEW;
}

export function loadStoredMapView(): StoredMapView | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAP_VIEW);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { center?: unknown; zoom?: unknown };
    if (!Array.isArray(parsed.center) || parsed.center.length !== 2) return null;

    const lat = Number(parsed.center[0]);
    const lng = Number(parsed.center[1]);
    const zoom = Number(parsed.zoom);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) {
      return null;
    }

    const bounds = L.latLngBounds(MAP_SETTINGS.BOUNDS.MAX);
    if (!bounds.contains([lat, lng])) return null;

    return { center: [lat, lng], zoom: clampZoom(zoom) };
  } catch (error) {
    if (APP_CONFIG.IS_DEV) {
      console.error("[mapViewStorage] Failed to load map view from localStorage:", error);
    }
    return null;
  }
}

export function createMapViewFromMap(map: L.Map): StoredMapView {
  const center = map.getCenter();
  const zoom = map.getZoom();

  return {
    center: [Number(center.lat.toFixed(6)), Number(center.lng.toFixed(6))],
    zoom: Number(clampZoom(zoom).toFixed(2)),
  };
}

export function saveMapView(view: StoredMapView): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.MAP_VIEW, JSON.stringify(view));
  } catch (error) {
    if (APP_CONFIG.IS_DEV) {
      console.error("[mapViewStorage] Failed to save map view to localStorage:", error);
    }
  }
}
