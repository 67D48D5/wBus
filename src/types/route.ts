// src/types/route.ts

export type RouteInfo = {
  routeName: string; // 사용자에게 보여주는 노선 이름 (ex. "30")
  representativeRouteId: string; // TAGO API 요청 시 사용하는 ID
  vehicleRouteIds: string[]; // 실시간 버스 위치 요청 시 사용하는 ID 목록
};

export type BusStop = {
  gpslati: number;
  gpslong: number;
  nodeid: string;
  nodenm: string;
  nodeord: number;
  updowncd: number;
};
