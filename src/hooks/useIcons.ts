// src/hooks/useIcons.ts

"use client";

import { useMemo } from "react";

// 서버 환경에서는 leaflet 불러오지 않음
const isClient = typeof window !== "undefined";

type IconMap = {
  busIconUp: L.Icon;
  busIconDown: L.Icon;
  findMyLocationIcon: L.Icon;
  myIcon: L.Icon;
  busStopIcon: L.Icon;
  busStopIconYonsei: L.Icon;
};

export function useIcons(): Partial<IconMap> {
  return useMemo(() => {
    if (typeof window === "undefined") return {};

    const L = require("leaflet");
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

    return {
      busIconUp: createIcon(
        "/images/bus-icon-up.png",
        [64, 64],
        [32, 32],
        [0, -20]
      ),
      busIconDown: createIcon(
        "/images/bus-icon-down.png",
        [64, 64],
        [32, 32],
        [0, -20]
      ),
      findMyLocationIcon: createIcon(
        "/images/find-my-location.svg",
        [32, 32],
        [16, 32],
        [0, -30]
      ),
      myIcon: createIcon(
        "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        [32, 32],
        [16, 32],
        [0, -30]
      ),
      busStopIcon: createIcon(
        "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        [16, 16],
        [8, 16],
        [0, -14]
      ),
      busStopIconYonsei: createIcon(
        "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        [32, 32],
        [8, 32],
        [0, -30]
      ),
    };
  }, []);
}
