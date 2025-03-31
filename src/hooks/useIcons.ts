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
      console.error("Leaflet 로드 실패:", error);
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
      busIcon: createIcon("/images/bus-icon.png", [64, 64], [32, 32], [0, -20]),
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
      myLocationIcon: createIcon(
        "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        [32, 32],
        [16, 32],
        [0, -30]
      ),
      findMyLocationIcon: createIcon(
        "/images/find-my-location.svg",
        [32, 32],
        [16, 32],
        [0, -30]
      ),
    };

    return globalIcons;
  }, []);
}
