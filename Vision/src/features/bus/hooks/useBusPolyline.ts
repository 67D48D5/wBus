// src/features/bus/hooks/useBusPolyline.ts

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@core/config/env";

import { getPolyline } from "@bus/api/getStaticData";

import { transformPolyline } from "@map/utils/polyUtils";

import type { GeoPolyline } from "@core/domain/polyline";

export function useBusPolyline(routeName: string, routeId?: string | null) {
  const [data, setData] = useState<GeoPolyline | null>(null);
  const routeKey = useMemo(() => routeId, [routeId]);

  useEffect(() => {
    if (!routeKey) {
      setData(null);
      return;
    }

    setData(null);
    getPolyline(routeKey)
      .then((json) => {
        // json can be null if polyline file is not found (404)
        setData(json);
      })
      .catch((error) => { if (APP_CONFIG.IS_DEV) console.error("[useBusPolyline] Error fetching polyline data for routeKey: " + routeKey, error) });
  }, [routeKey]);

  const { upPolyline, downPolyline } = useMemo(() => {
    if (!data) return { upPolyline: [], downPolyline: [] };
    return transformPolyline(data);
  }, [data]);

  return { upPolyline, downPolyline };
}
