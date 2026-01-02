// src/features/live/components/MyLocation.tsx

"use client";

import { useState } from "react";
import { Locate } from "lucide-react";

import { ERROR_MESSAGES, UI_TEXT } from "@core/constants/locale";
import { MAP_FLY_TO_DURATION, MY_LOCATION_ZOOM } from "@core/constants/env";

import { useBusContext } from "@live/context/MapContext";
import { useIcons } from "@live/hooks/useIcons";

export default function MyLocation() {
  const { map } = useBusContext();
  const { myLocationIcon } = useIcons();
  const [marker, setMarker] = useState<any>(null);

  const handleClick = async () => {
    try {
      // Dynamically import Leaflet to avoid SSR issues
      const L = await import("leaflet");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (map) {
            // Move the map to the user's location
            map.flyTo([latitude, longitude], MY_LOCATION_ZOOM, {
              animate: true,
              duration: MAP_FLY_TO_DURATION,
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
                UI_TEXT.MY_LOCATION_POPUP(latitude, longitude)
              )
              .openPopup();

            setMarker(newMarker);
          }
        },
        () => {
          alert(ERROR_MESSAGES.LOCATION_UNAVAILABLE);
        }
      );
    } catch (error) {
      console.error(ERROR_MESSAGES.LEAFLET_IMPORT_ERROR, error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-30 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:shadow-blue-400/60 transition-all duration-300 hover:scale-125 active:scale-95 border-2 border-white/30 backdrop-blur-sm drop-shadow-lg"
      title={UI_TEXT.FIND_MY_LOCATION}
      aria-label={UI_TEXT.FIND_MY_LOCATION}
    >
      <Locate className="w-6 h-6" />
    </button>
  );
}
