// src/constants/icons.ts

import L from "leaflet";

export const busIconUp = new L.Icon({
  iconUrl: "/images/bus-icon-up.png",
  iconSize: [64, 64],
  iconAnchor: [32, 32],
  popupAnchor: [0, -20],
});

export const busIconDown = new L.Icon({
  iconUrl: "/images/bus-icon-down.png",
  iconSize: [64, 64],
  iconAnchor: [32, 32],
  popupAnchor: [0, -20],
});

export const findMyLocationIcon = new L.Icon({
  iconUrl: "/images/find-my-location.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

export const myIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

export const busStopIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [16, 16],
  iconAnchor: [8, 16],
  popupAnchor: [0, -14],
});
