// src/components/MyLocation.tsx

"use client";

import { useMapContext } from "@/context/MapContext";
import { myIcon, findMyLocationIcon } from "@/constants/icons";

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

        // Fly to the current location
        map.flyTo([latitude, longitude], 17, {
          animate: true,
          duration: 1.5,
        });

        // Remove existing marker
        if (marker) {
          map.removeLayer(marker);
        }

        // Add a new marker
        const newMarker = L.marker([latitude, longitude], { icon: myIcon })
          .addTo(map)
          .bindPopup("<b>내 위치</b>")
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
      <img src={findMyLocationIcon.options.iconUrl} alt="내 위치 찾기" />
    </button>
  );
}
