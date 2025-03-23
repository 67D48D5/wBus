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

export type BusDataError =
  | "ERR:NONE_RUNNING" // 운행 종료
  | "ERR:NETWORK" // 네트워크 문제
  | "ERR:INVALID_ROUTE" // routeId 없음
  | null; // 정상

const cache: Record<string, BusItem[]> = {};
const dataListeners: Record<string, ((data: BusItem[]) => void)[]> = {};
const errorListeners: Record<string, ((errMsg: BusDataError) => void)[]> = {};

function clearOtherCaches(current: string) {
  Object.keys(cache).forEach((key) => {
    if (key !== current) delete cache[key];
  });
}

export function useBusData(routeName: string): {
  data: BusItem[];
  error: BusDataError;
} {
  const [busList, setBusList] = useState<BusItem[]>([]);
  const [error, setError] = useState<BusDataError>(null);

  useEffect(() => {
    if (!routeName) return;

    clearOtherCaches(routeName);

    if (cache[routeName]) {
      setBusList(cache[routeName]);
      setTimeout(() => {
        dataListeners[routeName]?.forEach((cb) => cb(cache[routeName]!));
      }, 0);
    }

    const updateData = (data: BusItem[]) => {
      setBusList(data);
      setError(null);
    };

    const isError = (msg: BusDataError): boolean => msg !== null;

    const updateError = (msg: BusDataError) => {
      setError(msg);
      if (isError(msg)) setBusList([]);
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
        throw new Error("ERR:INVALID_ROUTE");
      }

      const results = await Promise.allSettled(
        vehicleIds.map((id) => fetchBusLocationData(id))
      );

      const fulfilledResults = results.filter(
        (r): r is PromiseFulfilledResult<BusItem[]> => r.status === "fulfilled"
      );

      // 모두 실패한 경우 = 네트워크 문제
      if (fulfilledResults.length === 0) {
        throw new Error("ERR:NETWORK");
      }

      const buses = fulfilledResults.flatMap((r) => r.value);
      cache[routeName] = buses;
      dataListeners[routeName]?.forEach((cb) => cb(buses));

      // 응답은 있었지만 데이터가 없으면 = 운행 종료
      if (buses.length === 0) {
        errorListeners[routeName]?.forEach((cb) => cb("ERR:NONE_RUNNING"));
      } else {
        errorListeners[routeName]?.forEach((cb) => cb(null));
      }
    } catch (err: any) {
      console.error("❌ Bus polling error:", err);

      // 버스 목록 초기화
      cache[routeName] = [];
      dataListeners[routeName]?.forEach((cb) => cb([])); // 중요!! ❗

      const errorCode: BusDataError =
        err.message === "ERR:INVALID_ROUTE" ||
        err.message === "ERR:NONE_RUNNING" ||
        err.message === "ERR:NETWORK"
          ? err.message
          : "ERR:NETWORK";

      errorListeners[routeName]?.forEach((cb) => cb(errorCode));
    }
  };

  fetchAndUpdate();

  const interval = setInterval(fetchAndUpdate, 10000);
  return () => clearInterval(interval);
}
