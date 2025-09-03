// src/features/bus/components/MyLocation.tsx

"use client";

import { useState, useEffect } from "react";

import { useMapContext } from "@map/context/MapContext";
import { useIcons } from "@map/hooks/useIcons";

export default function MyLocation() {
  const { map } = useMapContext();
  const { myLocationIcon, findMyLocationIcon } = useIcons();
  const [marker, setMarker] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClick = async () => {
    try {
      // Dynamically import Leaflet to avoid SSR issues
      const L = await import("leaflet");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (map) {
            // Move the map to the user's location
            map.flyTo([latitude, longitude], 17, {
              animate: true,
              duration: 1.5,
            });

            // If a marker already exists, remove it
            if (marker) {
              map.removeLayer(marker);
            }

            // Create a new marker for the user's location
            const newMarker = L.marker([latitude, longitude], {
              icon: myLocationIcon,
            })
              .addTo(map)
              .bindPopup(
                `<b>📍 내 위치</b><br>위도: ${latitude}<br>경도: ${longitude}`
              )
              .openPopup();

            setMarker(newMarker);
          }
        },
        () => {
          alert("🚨 위치 정보를 가져올 수 없습니다.");
        }
      );
    } catch (error) {
      console.error("Leaflet import error:", error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-30 bg-white hover:bg-blue-700 text-black text-xs px-3 py-2 rounded shadow-md"
    >
      {isClient && findMyLocationIcon && (
        <img src={findMyLocationIcon.options.iconUrl} alt="내 위치 찾기" />
      )}
    </button>
  );
}
