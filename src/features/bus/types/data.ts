// src/features/bus/types/data.ts

// Route Map
export type RouteInfo = {
  routeName: string; // 사용자에게 보여주는 노선 이름 (ex. "30")
  representativeRouteId: string; // TAGO API 요청 시 사용하는 ID
  vehicleRouteIds: string[]; // 실시간 버스 위치 요청 시 사용하는 ID 목록
};

// Bus Stop Info
export type BusStop = {
  gpslati: number;
  gpslong: number;
  nodeid: string;
  nodenm: string;
  nodeno: number;
  nodeord: number;
  updowncd: number;
};

// Bus Location Info
export type BusItem = {
  routenm: string;
  gpslati: number;
  gpslong: number;
  vehicleno: string;
  nodenm: string;
  nodeid: string;
  nodeord: number;
};

// Bus Stop Arrival Info
export type ArrivalInfo = {
  arrprevstationcnt: number;
  arrtime: number;
  routeid: string;
  routeno: string;
  vehicletp: string;
};

// Polyline
export type GeoFeature = {
  type: "Feature";
  properties: { linkId: number; linkOrd: number; updnDir: string };
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type GeoPolylineData = {
  type: "FeatureCollection";
  features: GeoFeature[];
};
