// src/components/MyLocation.tsx

"use client";

import { useState, useEffect } from "react";
import { useMapContext } from "@/context/MapContext";
import { useIcons } from "@/hooks/useIcons";

export default function MyLocation() {
  const { map } = useMapContext();
  const { myLocationIcon, findMyLocationIcon } = useIcons();
  // marker의 타입을 구체화할 수 있으나, 동적 import로 인해 any로 유지
  const [marker, setMarker] = useState<any>(null);
  // 클라이언트 환경임을 추적 (초기 렌더링 시 window 접근 방지)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClick = async () => {
    try {
      // 필요한 시점에 Leaflet을 동적으로 import하여 클라이언트 사이드 번들 크기를 줄임
      const L = await import("leaflet");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (map) {
            // 지도 중심을 현재 위치로 이동
            map.flyTo([latitude, longitude], 17, {
              animate: true,
              duration: 1.5,
            });

            // 기존 마커가 있다면 제거
            if (marker) {
              map.removeLayer(marker);
            }

            // 새로운 마커 생성 후 지도에 추가, 팝업 바인딩 및 열기
            const newMarker = L.marker([latitude, longitude], { icon: myLocationIcon })
              .addTo(map)
              .bindPopup(
                `<b>📍 내 위치</b><br>위도: ${latitude}<br>경도: ${longitude}`
              )
              .openPopup();

            setMarker(newMarker);
          }
        },
        () => {
          alert("위치 정보를 가져올 수 없습니다.");
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
