// src/features/live/hooks/usePolyline.ts

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@core/config/env";
import { LOG_MESSAGES } from "@core/config/locale";

import { getPolyline } from "@live/api/getStaticData";
import { transformPolyline } from "@live/utils/polyUtils";

import type { GeoPolylineData } from "@core/domain/live";

export function usePolyline(routeName: string, routeId?: string | null) {
  const [data, setData] = useState<GeoPolylineData | null>(null);
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
      .catch((error) => { if (APP_CONFIG.IS_DEV) console.error(LOG_MESSAGES.FETCH_FAILED("Polyline", 500), "[" + routeKey + "]", error) });
  }, [routeKey]);

  const { upPolyline, downPolyline } = useMemo(() => {
    if (!data) return { upPolyline: [], downPolyline: [] };
    return transformPolyline(data);
  }, [data]);

  return { upPolyline, downPolyline };
}
