// src/components/MyLocation.tsx

"use client";

import { useState, useEffect } from "react";

import { useMapContext } from "@/context/MapContext";
import { useIcons } from "@/hooks/useIcons";

export default function MyLocation() {
  const { map } = useMapContext();
  const { myIcon, findMyLocationIcon } = useIcons();
  const [marker, setMarker] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // 클라이언트 환경에서만 true
  }, []);

  const handleClick = async () => {
    const L = await import("leaflet");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        map?.flyTo([latitude, longitude], 17, {
          animate: true,
          duration: 1.5,
        });

        if (marker) map?.removeLayer(marker);

        const newMarker = L.marker([latitude, longitude], { icon: myIcon })
          .addTo(map!)
          .bindPopup(`<b>📍 내 위치</b><br>위도: ${latitude}<br>경도: ${longitude}`)
          .openPopup();

        setMarker(newMarker);
      },
      () => {
        alert("위치 정보를 가져올 수 없습니다.");
      }
    );
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
