// src/features/live/hooks/useIcons.ts

"use client";

import { useMemo } from "react";

import { APP_CONFIG, MAP_SETTINGS } from "@core/config/env";
import { LOG_MESSAGES } from "@core/config/locale";

// Check if we are in a client environment
const isClient = typeof window !== "undefined";

// Create a global variable to store icons
let globalIcons: Partial<IconMap> | null = null;

type IconMap = {
  busIcon: L.Icon;
  busStopIcon: L.Icon;
};

export function useIcons(): Partial<IconMap> {
  return useMemo(() => {
    if (!isClient) return {};
    if (globalIcons) return globalIcons;

    let L;
    try {
      L = require("leaflet");
    } catch (error) {
      if (APP_CONFIG.IS_DEV) {
        console.error(LOG_MESSAGES.UNHANDLED_EXCEPTION, error);
      }
      return {};
    }

    const createIcon = (
      url: string,
      size: [number, number],
      anchor: [number, number],
      popup: [number, number]
    ) =>
      new L.Icon({
        iconUrl: url,
        iconSize: size,
        iconAnchor: anchor,
        popupAnchor: popup,
      });

    const busMarkerSettings = MAP_SETTINGS.MARKERS.BUS;

    globalIcons = {
      busIcon: createIcon(
        "/icons/bus-icon.png",
        busMarkerSettings.ICON_SIZE,
        busMarkerSettings.ICON_ANCHOR,
        busMarkerSettings.POPUP_ANCHOR
      ),
      busStopIcon: createIcon(
        "/icons/bus-stop-icon.png",
        [16, 16],
        [8, 16],
        [0, -14]
      )
    };

    return globalIcons;
  }, []);
}
