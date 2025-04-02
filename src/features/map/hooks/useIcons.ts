// src/hooks/useIcons.ts

"use client";

import { useMemo } from "react";

// 서버 환경 여부를 미리 판단
const isClient = typeof window !== "undefined";

// 아이콘을 전역으로 캐싱 (한번 생성된 이후 재사용)
let globalIcons: Partial<IconMap> | null = null;

type IconMap = {
  busIcon: L.Icon;
  busStopIcon: L.Icon;
  busStopIconYonsei: L.Icon;
  myLocationIcon: L.Icon;
  findMyLocationIcon: L.Icon;
};

export function useIcons(): Partial<IconMap> {
  return useMemo(() => {
    if (!isClient) return {};

    // 전역 캐시가 이미 존재하면 재사용
    if (globalIcons) return globalIcons;

    let L;
    try {
      L = require("leaflet");
    } catch (error) {
      console.error("Leaflet import error:", error);
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
      busIcon: createIcon(
        "/assets/icons/bus-icon.png",
        [29, 43],
        [14, 21],
        [0, -21]
      ),
      busStopIcon: createIcon(
        "/assets/icons/bus-stop-icon.png",
        [16, 16],
        [8, 16],
        [0, -14]
      ),
      busStopIconYonsei: createIcon(
        "/assets/icons/bus-stop-icon-yonsei.png",
        [64, 64],
        [30, 62],
        [0, -62]
      ),
      myLocationIcon: createIcon(
        "/assets/icons/my-location.svg",
        [32, 32],
        [16, 32],
        [0, -30]
      ),
      findMyLocationIcon: createIcon(
        "/assets/icons/find-my-location.svg",
        [32, 32],
        [16, 32],
        [0, -30]
      ),
    };

    return globalIcons;
  }, []);
}
