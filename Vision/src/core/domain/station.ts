// src/core/domain/station.ts

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

// Bus Stop Arrival Info
export type BusStopArrival = {
    arrprevstationcnt: number;
    arrtime: number;
    routeid: string;
    routeno: string;
    vehicletp: string;
};