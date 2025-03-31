// src/features/map/components/RotatedMarker.tsx

"use client";

import L from "leaflet";
import { forwardRef, useEffect, useRef } from "react";
import { Marker, MarkerProps } from "react-leaflet";

// 동적 import for browser only
if (typeof window !== "undefined") {
  require("leaflet.marker.slideto");
  require("leaflet-rotatedmarker");
}

// 타입 확장
declare module "leaflet" {
  interface Marker {
    slideTo?: (latlng: L.LatLngExpression, options?: any) => this;
    setRotationAngle?: (angle: number) => void;
    setRotationOrigin?: (origin: string) => void;
  }
}

// 회전 마커 컴포넌트
const RotatedMarker = forwardRef<
  L.Marker,
  MarkerProps & { rotationAngle?: number; rotationOrigin?: string }
>(({ rotationAngle = 0, rotationOrigin = "center", ...props }, ref) => {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setRotationAngle?.(rotationAngle);
      markerRef.current.setRotationOrigin?.(rotationOrigin);
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

export default RotatedMarker;
