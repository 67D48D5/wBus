// src/hooks/useBusLocationData.ts

import { useEffect, useState } from "react";
import { getBusLocationData } from "@/utils/getRealtimeData";
import { getRouteMap } from "@/utils/getRouteMap";

import type { BusDataError } from "@/types/error";
import type { BusItem } from "@/types/data";

const cache: Record<string, BusItem[]> = {};
const dataListeners: Record<string, ((data: BusItem[]) => void)[]> = {};
const errorListeners: Record<string, ((errMsg: BusDataError) => void)[]> = {};

const REFRESH_INTERVAL = Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL);

if (!REFRESH_INTERVAL) {
  throw new Error(
    "NEXT_PUBLIC_REFRESH_INTERVAL 환경 변수가 설정되지 않았습니다."
  );
}

/**
 * 현재 라우트 외의 캐시 데이터를 제거합니다.
 * 필요시 listeners도 같이 정리할 수 있습니다.
 */
function clearOtherCaches(current: string) {
  Object.keys(cache).forEach((key) => {
    if (key !== current) {
      delete cache[key];
    }
  });
}

export function useBusLocationData(routeName: string): {
  data: BusItem[];
  error: BusDataError;
} {
  const [busList, setBusList] = useState<BusItem[]>([]);
  const [error, setError] = useState<BusDataError>(null);

  useEffect(() => {
    if (!routeName) return;

    // 다른 라우트의 캐시를 제거
    clearOtherCaches(routeName);

    // 이미 캐시된 데이터가 있다면 즉시 반영
    if (cache[routeName]) {
      setBusList(cache[routeName]);
      setTimeout(() => {
        dataListeners[routeName]?.forEach((cb) => cb(cache[routeName]!));
      }, 0);
    }

    // 데이터 업데이트 콜백
    const updateData = (data: BusItem[]) => {
      setBusList(data);
      setError(null);
    };

    // 에러 업데이트 콜백
    const updateError = (msg: BusDataError) => {
      setError(msg);
      if (msg !== null) {
        setBusList([]);
      }
    };

    dataListeners[routeName] = dataListeners[routeName] || [];
    errorListeners[routeName] = errorListeners[routeName] || [];

    dataListeners[routeName].push(updateData);
    errorListeners[routeName].push(updateError);

    // 컴포넌트 언마운트 시 등록한 콜백 제거
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

const VALID_ERROR_CODES = new Set([
  "ERR:INVALID_ROUTE",
  "ERR:NONE_RUNNING",
  "ERR:NETWORK",
]);

export function startBusPolling(routeName: string) {
  const fetchAndUpdate = async () => {
    try {
      const routeNames = await getRouteMap();
      const vehicleIds = routeNames[routeName];

      if (!vehicleIds || vehicleIds.length === 0) {
        throw new Error("ERR:INVALID_ROUTE");
      }

      const results = await Promise.allSettled(
        vehicleIds.map((id) => getBusLocationData(id))
      );

      const fulfilledResults = results.filter(
        (r): r is PromiseFulfilledResult<BusItem[]> => r.status === "fulfilled"
      );

      // 모두 실패하면 네트워크 문제로 간주
      if (fulfilledResults.length === 0) {
        throw new Error("ERR:NETWORK");
      }

      const buses = fulfilledResults.flatMap((r) => r.value);
      cache[routeName] = buses;
      dataListeners[routeName]?.forEach((cb) => cb(buses));

      // 데이터는 있지만 버스가 없는 경우 운행 종료로 간주
      if (buses.length === 0) {
        errorListeners[routeName]?.forEach((cb) => cb("ERR:NONE_RUNNING"));
      } else {
        errorListeners[routeName]?.forEach((cb) => cb(null));
      }
    } catch (err: unknown) {
      console.error("❌ Bus polling error:", err);

      // 버스 목록 초기화 및 데이터 리스너에 빈 배열 전달 (중요!)
      cache[routeName] = [];
      dataListeners[routeName]?.forEach((cb) => cb([]));

      // 에러 메시지 결정 (Error 인스턴스인지 체크)
      let errorCode: BusDataError = "ERR:NETWORK";
      if (err instanceof Error && VALID_ERROR_CODES.has(err.message)) {
        errorCode = err.message as BusDataError;
      }
      errorListeners[routeName]?.forEach((cb) => cb(errorCode));
    }
  };

  // 최초 데이터 요청
  fetchAndUpdate();

  const interval = setInterval(fetchAndUpdate, REFRESH_INTERVAL);

  // 페이지 포커스가 돌아오면 즉시 데이터 요청
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      fetchAndUpdate();
    }
  };

  // 페이지가 다시 보여질 때 (캐시된 페이지) 데이터 요청
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      fetchAndUpdate();
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pageshow", handlePageShow);

  // 정리 함수: 인터벌 및 이벤트 리스너 제거
  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pageshow", handlePageShow);
  };
}
