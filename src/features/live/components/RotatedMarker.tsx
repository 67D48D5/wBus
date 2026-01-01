// src/features/live/components/RotatedMarker.tsx

"use client";

import L from "leaflet";
import { forwardRef, useEffect, useRef } from "react";
import { Marker, MarkerProps } from "react-leaflet";

if (typeof window !== "undefined") {
  require("leaflet-rotatedmarker");
}

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
          (ref as React.RefObject<L.Marker | null>).current = instance;
        }
      }}
      {...props}
    />
  );
});

RotatedMarker.displayName = "RotatedMarker";

export default RotatedMarker;
