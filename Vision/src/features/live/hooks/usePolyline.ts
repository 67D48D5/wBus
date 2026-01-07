// src/features/live/hooks/usePolyline.ts

import { useEffect, useMemo, useState } from "react";

import { ERROR_MESSAGES } from "@core/constants/locale";

import { getPolyline, transformPolyline } from "@live/api/getPolyline";

import type { GeoPolylineData } from "@live/models/data";

function buildRouteKey(routeName: string, routeId?: string | null) {
  if (!routeName || !routeId) return null;
  return `${routeName}_${routeId}`;
}

export function usePolyline(routeName: string, routeId?: string | null) {
  const [data, setData] = useState<GeoPolylineData | null>(null);
  const routeKey = useMemo(() => buildRouteKey(routeName, routeId), [routeId, routeName]);

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
      .catch((error) => console.error(ERROR_MESSAGES.POLYLINE_FETCH_ERROR, error));
  }, [routeKey]);

  const { upPolyline, downPolyline } = useMemo(() => {
    if (!data) return { upPolyline: [], downPolyline: [] };
    return transformPolyline(data);
  }, [data]);

  return { upPolyline, downPolyline };
}
