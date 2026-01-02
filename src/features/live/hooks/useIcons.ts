// src/features/live/hooks/useIcons.ts

"use client";

import { useMemo } from "react";

import { ERROR_MESSAGES } from "@core/constants/locale";

// Check if we are in a client environment
const isClient = typeof window !== "undefined";

// Create a global variable to store icons
let globalIcons: Partial<IconMap> | null = null;

type IconMap = {
  busIcon: L.Icon;
  busStopIcon: L.Icon;
  myLocationIcon: L.Icon;
  findMyLocationIcon: L.Icon;
};

export function useIcons(): Partial<IconMap> {
  return useMemo(() => {
    if (!isClient) return {};
    if (globalIcons) return globalIcons;

    let L;
    try {
      L = require("leaflet");
    } catch (error) {
      console.error(ERROR_MESSAGES.LEAFLET_IMPORT_ERROR, error);
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

    globalIcons = {
      busIcon: createIcon("/icons/bus-icon.png", [29, 43], [14, 21], [0, -21]),
      busStopIcon: createIcon(
        "/icons/bus-stop-icon.png",
        [16, 16],
        [8, 16],
        [0, -14]
      ),
      myLocationIcon: createIcon(
        "/icons/my-location.svg",
        [32, 32],
        [16, 32],
        [0, -30]
      ),
      findMyLocationIcon: createIcon(
        "/icons/find-my-location.svg",
        [32, 32],
        [16, 32],
        [0, -30]
      ),
    };

    return globalIcons;
  }, []);
}
