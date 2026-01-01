// models/bus.ts

export interface BusTime {
    minute: string;  // Minute
    noteId?: string; // Note identifier
}

export interface HourlySchedule {
    [destination: string]: BusTime[];
}

export interface BusData {
    routeId: string;
    routeName: string;
    description: string;
    lastUpdated: string;
    directions: string[];
    routeDetails?: string[];
    featuredStops?: { [key: string]: string[] };
    schedule: {
        general?: { [hour: string]: HourlySchedule };
        weekday?: { [hour: string]: HourlySchedule };
        weekend?: { [hour: string]: HourlySchedule };
    };
    notes?: { [key: string]: string };
}