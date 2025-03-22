// src/components/MyLocation.tsx

"use client";

import { useMapContext } from "@/context/MapContext";
import { useState } from "react";
import L from "leaflet";

export default function MyLocation() {
  const { map } = useMapContext();
  const [marker, setMarker] = useState<L.Marker | null>(null);

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert("위치 정보를 지원하지 않는 브라우저입니다.");
      return;
    }

    if (!map) {
      alert("지도가 아직 로드되지 않았습니다!");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // 지도 중심 이동
        map.flyTo([latitude, longitude], 17, {
          animate: true,
          duration: 1.5,
        });

        // 기존 마커 제거
        if (marker) {
          map.removeLayer(marker);
        }

        // 새 마커 추가
        const myIcon = new L.Icon({
            iconUrl: "/images/geo-alt-fill.svg",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -30], 
          });

        const newMarker = L.marker([latitude, longitude], { icon: myIcon })
          .addTo(map)
          .bindPopup("<b>📍 내 위치</b>")
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
      className="fixed bottom-4 right-4 z-[1001] bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded shadow-md"
    >
      📍
    </button>
  );
}
