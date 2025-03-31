// src/components/BusMarker.tsx

"use client";

import L from "leaflet";
// 클라이언트 환경에서만 플러그인을 동적으로 로드
if (typeof window !== "undefined") {
  require("leaflet.marker.slideto");
  require("leaflet-rotatedmarker");
}

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useMemo,
  useCallback,
} from "react";
import { Marker, MarkerProps, Popup, Tooltip } from "react-leaflet";

import { useIcons } from "@/hooks/useIcons";
import { getRouteInfo } from "@/utils/getRouteMap";
import { usePolyline } from "@/hooks/usePolyline";
import { useBusDirection } from "@/hooks/useBusDirection";
import { useBusLocationData } from "@/hooks/useBusLocation";
import { mergePolylines, snapToPolyline } from "@/utils/getPolyline";

import type { RouteInfo } from "@/types/data";

const RotatedMarker = forwardRef<
  L.Marker,
  MarkerProps & { rotationAngle?: number; rotationOrigin?: string }
>(({ rotationAngle = 0, rotationOrigin = "center", ...props }, ref) => {
  const markerRef = useRef<L.Marker | null>(null);

  // 마커 생성 후, rotationAngle과 rotationOrigin을 업데이트
  useEffect(() => {
    if (markerRef.current) {
      if (markerRef.current.setRotationAngle) {
        markerRef.current.setRotationAngle(rotationAngle);
      }

      if (markerRef.current.setRotationOrigin) {
        markerRef.current.setRotationOrigin(rotationOrigin);
      }
    }
  }, [rotationAngle, rotationOrigin]);

  return (
    <Marker
      ref={(instance) => {
        markerRef.current = instance;
        if (typeof ref === "function") {
          ref(instance);
        } else if (ref) {
          (ref as React.MutableRefObject<L.Marker | null>).current = instance;
        }
      }}
      {...props}
    />
  );
});

RotatedMarker.displayName = "RotatedMarker";

export { RotatedMarker };

// leaflet.marker.slideto 모듈이 L.Marker.prototype에 slideTo 메서드를 추가하는지 확인
declare module "leaflet" {
  interface Marker {
    slideTo?: (latlng: L.LatLngExpression, options?: any) => this;
    setRotationAngle?: (angle: number) => void;
    setRotationOrigin?: (origin: string) => void;
  }
}

/**
 * BusMarker 컴포넌트
 * - 버스의 GPS 좌표를 해당 노선(Polyline)에 스냅하고,
 * - 선분 방향에 따라 아이콘을 회전시켜 지도에 표시합니다.
 */
export default function BusMarker({ routeName }: { routeName: string }) {
  // 노선 관련 정보 로드
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const { busIcon } = useIcons();

  useEffect(() => {
    async function loadRouteInfo() {
      const info = await getRouteInfo(routeName);
      setRouteInfo(info);
    }
    loadRouteInfo();
  }, [routeName]);

  // 버스 위치 데이터 및 정류장 방향 계산 함수
  const { data: busList } = useBusLocationData(routeName);
  const getDirection = useBusDirection(routeName);

  // 버스 마커에 대한 레퍼런스 (애니메이션 처리를 위해)
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // 노선(Polyline) 데이터 로드 및 병합
  const { upPolyline, downPolyline } = usePolyline(routeName);
  const mergedUpPolyline = useMemo(
    () => mergePolylines(upPolyline),
    [upPolyline]
  );
  const mergedDownPolyline = useMemo(
    () => mergePolylines(downPolyline),
    [downPolyline]
  );

  /**
   * 버스 위치를 폴리라인에 스냅시키고, 해당 선분의 회전 각도를 계산
   * @param bus - 버스 데이터 객체
   * @returns { position, angle, direction }
   */
  const getSnappedData = useCallback(
    (bus: any) => {
      // getDirection이 null일 경우 fallback으로 0 사용
      const direction = getDirection(bus.nodeid, bus.nodeord) ?? 0;
      // 방향에 따라 적절한 폴리라인 선택
      const polyline = direction === 1 ? mergedUpPolyline : mergedDownPolyline;

      if (polyline.length > 1) {
        const snapped = snapToPolyline([bus.gpslati, bus.gpslong], polyline);
        if (snapped) {
          return {
            position: snapped.position as L.LatLngTuple,
            angle: snapped.angle,
            direction,
          };
        }
      }
      // 스냅 실패 시, 원래 GPS 좌표 사용
      return {
        position: [bus.gpslati, bus.gpslong] as L.LatLngTuple,
        angle: 0,
        direction,
      };
    },
    [getDirection, mergedUpPolyline, mergedDownPolyline]
  );

  // 버스 위치 업데이트: slideTo 애니메이션을 이용해 마커 이동
  useEffect(() => {
    busList.forEach((bus) => {
      const key = `${bus.vehicleno}`;
      const marker = markerRefs.current[key];
      if (marker) {
        const { position } = getSnappedData(bus);
        const newLatLng = L.latLng(position[0], position[1]);
        if (!marker.getLatLng().equals(newLatLng)) {
          if (typeof marker.slideTo === "function") {
            marker.slideTo(newLatLng, { duration: 5000 });
          } else {
            marker.setLatLng(newLatLng);
          }
        }
      }
    });
  }, [busList, getSnappedData]);

  // 데이터가 없으면 null 반환
  if (!routeInfo || busList.length === 0) return null;

  return (
    <>
      {busList.map((bus) => {
        const key = `${bus.vehicleno}`;
        const { position, angle, direction } = getSnappedData(bus);
        const correctedAngle = angle % 360;

        return (
          <RotatedMarker
            key={key}
            position={position}
            rotationAngle={correctedAngle}
            icon={busIcon}
            ref={(marker: L.Marker | null) => {
              if (marker) {
                markerRefs.current[key] = marker;
              }
            }}
          >
            <Tooltip permanent offset={[0, 0]} className="bus-route-label">
              {bus.routenm}
            </Tooltip>
            <Popup autoPan={false}>
              <div className="font-bold mb-1">
                {direction === 1 ? "⬆️" : "⬇️"} {bus.routenm}번
              </div>
              {bus.vehicleno}, {bus.nodenm}
            </Popup>
          </RotatedMarker>
        );
      })}
    </>
  );
}
