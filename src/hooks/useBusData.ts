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
const dataListeners: Record<string, ((data: BusItem[]) => void)[]> = {};
const errorListeners: Record<string, ((errMsg: string | null) => void)[]> = {};

export function useBusData(routeId: string): {
  data: BusItem[];
  error: string | null;
} {
  const [busList, setBusList] = useState<BusItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeId) return;

    if (cache[routeId]) {
      setBusList(cache[routeId]);
      setTimeout(() => {
        dataListeners[routeId]?.forEach((cb) => cb(cache[routeId]!));
      }, 0);
    }

    const updateData = (data: BusItem[]) => {
      setBusList(data);
      setError(null); // 데이터 성공 → 에러 초기화
    };

    const updateError = (msg: string | null) => {
      if (msg) {
        alert(msg);
      }
      setError(msg);
    };

    dataListeners[routeId] = dataListeners[routeId] || [];
    errorListeners[routeId] = errorListeners[routeId] || [];

    dataListeners[routeId].push(updateData);
    errorListeners[routeId].push(updateError);

    return () => {
      dataListeners[routeId] = dataListeners[routeId].filter(
        (fn) => fn !== updateData
      );
      errorListeners[routeId] = errorListeners[routeId].filter(
        (fn) => fn !== updateError
      );
    };
  }, [routeId]);

  return { data: busList, error };
}

export function startBusPolling(routeId: string) {
  const fetchAndUpdate = async () => {
    try {
      let vehicleIds: string[];

      // routeIds.json 요청 try-catch
      try {
        const res = await fetch("/routeIds.json");
        if (!res.ok) throw new Error("🚫 routeIds.json 요청 실패");
        const data = await res.json();
        vehicleIds = data[routeId];
      } catch (e) {
        throw new Error("📁 routeIds.json 파일을 불러올 수 없습니다.");
      }

      if (!vehicleIds || vehicleIds.length === 0) {
        throw new Error("🚫 해당 노선의 vehicleId를 찾을 수 없습니다.");
      }

      // 각 vehicleId별 요청 → 개별적으로 처리
      const results = await Promise.allSettled(
        vehicleIds.map((id) => fetchBusLocationData(id))
      );

      const buses = results
        .filter((r): r is PromiseFulfilledResult<BusItem[]> => r.status === "fulfilled")
        .map((r) => r.value)
        .flat();

      if (buses.length === 0) {
        throw new Error("❗ 버스 데이터 응답이 없습니다.");
      }

      cache[routeId] = buses;
      dataListeners[routeId]?.forEach((cb) => cb(buses));
      errorListeners[routeId]?.forEach((cb) => cb(null)); // 정상
    } catch (err: any) {
      console.error("❌ Bus polling error:", err);
      errorListeners[routeId]?.forEach((cb) =>
        cb(err.message || "❗ 알 수 없는 에러가 발생했습니다.")
      );
    }
  };

  // Initial fetch
  fetchAndUpdate();
  
  const interval = setInterval(fetchAndUpdate, 10000);
  return () => clearInterval(interval);
}