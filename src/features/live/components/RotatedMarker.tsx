// src/features/live/components/RotatedMarker.tsx

"use client";

import L from "leaflet";
import { Marker, MarkerProps } from "react-leaflet";
import { forwardRef, useEffect, useRef } from "react";

if (typeof window !== "undefined") {
  require("leaflet-rotatedmarker");
}

const RotatedMarker = forwardRef<
  L.Marker,
  MarkerProps & { rotationAngle?: number; rotationOrigin?: string }
>(({ rotationAngle = 0, rotationOrigin = "center", position, ...props }, ref) => {
  const markerRef = useRef<L.Marker | null>(null);

  // Update rotation when it changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setRotationAngle?.(rotationAngle);
      markerRef.current.setRotationOrigin?.(rotationOrigin);
    }
  }, [rotationAngle, rotationOrigin]);

  // Update position when it changes - this is critical for animation!
  useEffect(() => {
    if (markerRef.current && position) {
      const latLng = Array.isArray(position)
        ? L.latLng(position[0], position[1])
        : position;
      markerRef.current.setLatLng(latLng);
    }
  }, [position]);

  return (
    <Marker
      position={position}
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
