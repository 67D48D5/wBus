// src/hooks/useBusData.ts

import { useEffect, useState } from "react";
import { fetchBusLocationData } from "@/utils/fetchData";
import { getRouteMap } from "@/utils/getRouteMap";

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

export function useBusData(routeName: string): {
  data: BusItem[];
  error: string | null;
} {
  const [busList, setBusList] = useState<BusItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeName) return;

    if (cache[routeName]) {
      setBusList(cache[routeName]);
      setTimeout(() => {
        dataListeners[routeName]?.forEach((cb) => cb(cache[routeName]!));
      }, 0);
    }

    const updateData = (data: BusItem[]) => {
      setBusList(data);
      setError(null); // 데이터 성공 → 에러 초기화
    };

    const updateError = (msg: string | null) => {
      /* if (msg) { alert(msg); } */
      setError(msg);
    };

    dataListeners[routeName] = dataListeners[routeName] || [];
    errorListeners[routeName] = errorListeners[routeName] || [];

    dataListeners[routeName].push(updateData);
    errorListeners[routeName].push(updateError);

    return () => {
      dataListeners[routeName] = dataListeners[routeName].filter(
        (fn) => fn !== updateData
      );
      errorListeners[routeName] = errorListeners[routeName].filter(
        (fn) => fn !== updateError
      );
    };
  }, [routeName]);

  return { data: busList, error };
}

export function startBusPolling(routeName: string) {
  const fetchAndUpdate = async () => {
    try {
      const routeNames = await getRouteMap();
      const vehicleIds = routeNames[routeName];

      if (!vehicleIds || vehicleIds.length === 0) {
        throw new Error("🚫 해당 노선의 vehicleId를 찾을 수 없습니다.");
      }

      const results = await Promise.allSettled(
        vehicleIds.map((id) => fetchBusLocationData(id))
      );

      const buses = results
        .filter(
          (r): r is PromiseFulfilledResult<BusItem[]> =>
            r.status === "fulfilled"
        )
        .map((r) => r.value)
        .flat();

      if (buses.length === 0) {
        throw new Error("❗ 버스 데이터 응답이 없습니다.");
      }

      cache[routeName] = buses;
      dataListeners[routeName]?.forEach((cb) => cb(buses));
      errorListeners[routeName]?.forEach((cb) => cb(null));
    } catch (err: any) {
      console.error("❌ Bus polling error:", err);
      errorListeners[routeName]?.forEach((cb) =>
        cb(err.message || "❗ 알 수 없는 에러가 발생했습니다.")
      );
    }
  };

  fetchAndUpdate();

  // Polling every 10 seconds
  const interval = setInterval(fetchAndUpdate, 10000);
  return () => clearInterval(interval);
}
