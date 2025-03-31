// src/hooks/useBusArrivalInfo.ts

import { useEffect, useState } from "react";

import { getBusArrivalInfoData } from "@bus/utils/getRealtimeData";

import type { ArrivalInfo } from "@bus/types/data";

const REFRESH_INTERVAL = Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL);

if (!REFRESH_INTERVAL) {
  throw new Error(
    "NEXT_PUBLIC_REFRESH_INTERVAL 환경 변수가 설정되지 않았습니다."
  );
}

export function useBusArrivalInfo(busStopId: string | null) {
  const [data, setData] = useState<ArrivalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // busStopId가 없으면 아무것도 안 함
    if (!busStopId || busStopId.trim() === "") return;

    let timer: NodeJS.Timeout | null = null;

    // 실제로 데이터를 불러오는 함수
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const result = await getBusArrivalInfoData(busStopId!);
        setData(result);
      } catch (e) {
        console.error(e);
        setError("도착 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    // 마운트(정류장 선택) 시점에 최초 1회 호출
    fetchData();

    // 이후 10초마다 재호출
    timer = setInterval(fetchData, REFRESH_INTERVAL);

    // 언마운트(또는 busStopId 변경) 시 타이머 정리
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [busStopId]);

  return { data, loading, error };
}

// 특정 노선의 도착 정보만 간단히 꺼내 쓰고 싶은 경우
export function getNextBusArrivalInfo(routeName: string, data: ArrivalInfo[]) {
  const target = data.find(
    (bus) => bus.routeno.replace("-", "") === routeName.replace("-", "")
  );
  if (!target) return null;

  return {
    minutes: Math.ceil(target.arrtime / 60),
    stopsAway: target.arrprevstationcnt,
  };
}
