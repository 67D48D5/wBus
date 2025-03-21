// src/hooks/useBusData.ts

import { useEffect, useState } from "react";
import { fetchBusLocationData } from "@/utils/fetchData";

type BusItem = {
  gpslati: number;
  gpslong: number;
  vehicleno: string;
  nodenm: string;
  nodeid: string;
};

const cache: Record<string, BusItem[]> = {};
const listeners: Record<string, ((data: BusItem[]) => void)[]> = {};

export function useBusData(routeId: string): BusItem[] {
  const [busList, setBusList] = useState<BusItem[]>([]);

  useEffect(() => {
    if (!routeId) return;

    // 캐시에 있으면 즉시 사용
    if (cache[routeId]) {
      setBusList(cache[routeId]);
    }

    // 리스너 등록
    const update = (data: BusItem[]) => setBusList(data);
    listeners[routeId] = listeners[routeId] || [];
    listeners[routeId].push(update);

    return () => {
      listeners[routeId] = listeners[routeId].filter((fn) => fn !== update);
    };
  }, [routeId]);

  return busList;
}

// 공유 폴링 함수
export function startBusPolling(routeId: string) {
  const fetchAndUpdate = async () => {
    try {
      const res = await fetch("/routeIds.json");
      const data = await res.json();
      const vehicleIds: string[] = data[routeId];
      if (!vehicleIds || vehicleIds.length === 0) return;

      const results = await Promise.all(
        vehicleIds.map((id) => fetchBusLocationData(id))
      );
      const buses = results.flat();
      cache[routeId] = buses;

      // 등록된 모든 리스너에 데이터 전달
      (listeners[routeId] || []).forEach((cb) => cb(buses));
    } catch (err) {
      console.error("❌ Bus polling error:", err);
    }
  };

  // Initial fetch
  fetchAndUpdate();

  const interval = setInterval(fetchAndUpdate, 10000);
  return () => clearInterval(interval);
}
