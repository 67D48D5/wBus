// src/hooks/useBusArrivalInfo.ts

import { useEffect, useState } from "react";
import { fetchBusArrivalInfoData } from "@/utils/fetchData";

import type { ArrivalInfo } from "@/types/data";

export function useBusArrivalInfo(busStopId: string | null) {
  const [data, setData] = useState<ArrivalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cache: Record<string, ArrivalInfo[]> = {};

  useEffect(() => {
    if (!busStopId) return;

    if (!busStopId || busStopId.trim() === "") return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (cache[busStopId]) {
        setData(cache[busStopId]);
        setLoading(false);
        return;
      }

      try {
        const result = await fetchBusArrivalInfoData(busStopId);
        cache[busStopId] = result;
        setData(result);
      } catch (e) {
        console.error(e);
        setError("도착 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [busStopId]);

  return { data, loading, error };
}
