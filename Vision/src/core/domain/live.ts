// src/core/domain/models/live.ts

// Route Map
export type RouteInfo = {
  routeName: string; // The route name shown to users (e.g., "30")
  representativeRouteId: string; // ID used for TAGO API requests
  vehicleRouteIds: string[]; // List of IDs used for real-time bus location requests
};

// Route Detail Sequence Item
export type SequenceItem = {
  nodeord: number;
  nodeid: string;
  updowncd: number;
};

// Route Detail from routeMap
export type RouteDetail = {
  sequence: SequenceItem[];
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
  routeid?: string; // Bus route ID
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
  properties: { dir: "up" | "down" };
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type GeoPolylineData = {
  type: "FeatureCollection";
  features: GeoFeature[];
};
