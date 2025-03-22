// src/constants/icons.ts

import L from "leaflet";

export const busStopIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export const busIconUp = new L.Icon({
  iconUrl: "/images/bus-icon-up.png",
  iconSize: [64, 64],
  iconAnchor: [32, 32],
});

export const busIconDown = new L.Icon({
  iconUrl: "/images/bus-icon-down.png",
  iconSize: [64, 64],
  iconAnchor: [32, 32],
});
