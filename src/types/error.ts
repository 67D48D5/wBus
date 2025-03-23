// src/types/error.ts

export type BusDataError =
  | "ERR:NONE_RUNNING" // 운행 종료
  | "ERR:NETWORK" // 네트워크 문제
  | "ERR:INVALID_ROUTE" // routeId 없음
  | null; // 정상
