# API Reference

This document provides detailed information about the wBus API structure, data formats, and interfaces.

## Table of Contents

- [Overview](#overview)
- [API Client](#api-client)
- [Bus APIs](#bus-apis)
- [Data Types](#data-types)
- [Error Handling](#error-handling)
- [Cache Management](#cache-management)

## Overview

The wBus application interacts with two types of data sources:

1. **Public Data Portal API** (via AWS API Gateway) - Real-time bus data
2. **Static Data Files** - Route configurations and polylines

### Base Configuration

```typescript
// src/core/constants/env.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "NOT_SET";
export const API_REFRESH_INTERVAL = 
  Number(process.env.NEXT_PUBLIC_API_REFRESH_INTERVAL) || 3000;
```

## API Client

### fetchAPI

Base API client with error handling and response parsing.

```typescript
// src/core/api/fetchAPI.ts
async function fetchAPI<T>(endpoint: string): Promise<T>
```

**Parameters:**
- `endpoint` (string): API endpoint path

**Returns:**
- `Promise<T>`: Parsed JSON response

**Throws:**
- Error if response is not OK
- Error if JSON parsing fails

**Example:**
```typescript
const data = await fetchAPI<BusLocationResponse>('/getBusLocation/123');
```

## Bus APIs

### getBusLocationData

Fetches real-time bus location data for a specific route.

```typescript
// src/features/bus/api/getRealtimeData.ts
async function getBusLocationData(routeId: string): Promise<BusItem[]>
```

**Parameters:**
- `routeId` (string): Route identifier

**Returns:**
- `Promise<BusItem[]>`: Array of bus location items

**Example:**
```typescript
const buses = await getBusLocationData('GWJ1000000001');
```

**Response Format:**
```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "vehicleno": "2345",
            "routenm": "30",
            "gpslati": 37.281150,
            "gpslong": 127.901946,
            "nodeid": "WJB251036041",
            "nodenm": "연세대",
            "nodeord": 10
          }
        ]
      }
    }
  }
}
```

### getBusStopLocationData

Fetches bus stop locations for a specific route.

```typescript
async function getBusStopLocationData(routeId: string): Promise<BusStop[]>
```

**Parameters:**
- `routeId` (string): Route identifier

**Returns:**
- `Promise<BusStop[]>`: Array of bus stop items

**Response Format:**
```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "nodeid": "WJB251036041",
            "nodenm": "연세대",
            "nodeord": 10,
            "gpslati": 37.281150,
            "gpslong": 127.901946,
            "updowncd": 1
          }
        ]
      }
    }
  }
}
```

### getBusArrivalInfoData

Fetches bus arrival information for a specific bus stop.

```typescript
async function getBusArrivalInfoData(busStopId: string): Promise<ArrivalInfo[]>
```

**Parameters:**
- `busStopId` (string): Bus stop identifier

**Returns:**
- `Promise<ArrivalInfo[]>`: Array of arrival information

**Response Format:**
```json
{
  "response": {
    "body": {
      "items": {
        "item": {
          "routenm": "30",
          "arrprevstationcnt": 3,
          "arrtime": 180,
          "vehicleno": "2345"
        }
      }
    }
  }
}
```

### getRouteMap

Fetches route configuration mapping.

```typescript
// src/features/bus/api/getRouteMap.ts
async function getRouteMap(): Promise<Record<string, string[]>>
```

**Returns:**
- `Promise<Record<string, string[]>>`: Map of route names to vehicle IDs

**Example:**
```typescript
const routeMap = await getRouteMap();
// {
//   "30": ["GWJ1000000001", "GWJ1000000002"],
//   "34": ["GWJ1000000003"],
//   "34-1": ["GWJ1000000004"]
// }
```

### getRouteInfo

Gets route information for a specific route name.

```typescript
async function getRouteInfo(routeName: string): Promise<RouteInfo | null>
```

**Parameters:**
- `routeName` (string): Route name (e.g., "30", "34")

**Returns:**
- `Promise<RouteInfo | null>`: Route information or null if not found

**Example:**
```typescript
const routeInfo = await getRouteInfo("30");
// {
//   routeName: "30",
//   representativeRouteId: "GWJ1000000001",
//   vehicleRouteIds: ["GWJ1000000001", "GWJ1000000002"]
// }
```

### getPolyline

Fetches route polyline geometry.

```typescript
// src/features/bus/api/getPolyline.ts
async function getPolyline(routeName: string): Promise<GeoPolylineData>
```

**Parameters:**
- `routeName` (string): Route name

**Returns:**
- `Promise<GeoPolylineData>`: GeoJSON polyline data

**Example:**
```typescript
const polyline = await getPolyline("30");
```

**Response Format (GeoJSON):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "updnDir": "1"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [127.901946, 37.281150],
          [127.902000, 37.281200]
        ]
      }
    }
  ]
}
```

## Data Types

### BusItem

Represents a single bus location.

```typescript
interface BusItem {
  vehicleno: string;      // Bus number (e.g., "2345")
  routenm: string;        // Route name (e.g., "30")
  gpslati: number;        // GPS latitude
  gpslong: number;        // GPS longitude
  nodeid: string;         // Current/nearest node ID
  nodenm: string;         // Current/nearest node name
  nodeord: number;        // Node order in route
}
```

### BusStop

Represents a bus stop.

```typescript
interface BusStop {
  nodeid: string;         // Stop ID
  nodenm: string;         // Stop name
  nodeord: number;        // Stop order in route
  gpslati: number;        // GPS latitude
  gpslong: number;        // GPS longitude
  updowncd: number;       // Direction (0: down, 1: up)
}
```

### ArrivalInfo

Represents bus arrival information.

```typescript
interface ArrivalInfo {
  routenm: string;             // Route name
  arrprevstationcnt: number;   // Stops away
  arrtime: number;             // Arrival time (seconds)
  vehicleno: string;           // Bus number
}
```

### RouteInfo

Route configuration information.

```typescript
interface RouteInfo {
  routeName: string;              // Route name
  representativeRouteId: string;  // Primary route ID
  vehicleRouteIds: string[];      // All route IDs
}
```

### GeoPolylineData

GeoJSON polyline data.

```typescript
interface GeoPolylineData {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      updnDir: string;  // Direction ("0" or "1")
    };
    geometry: {
      type: "LineString";
      coordinates: Array<[number, number]>;  // [lng, lat]
    };
  }>;
}
```

### BusDataError

Error type for bus data operations.

```typescript
type BusDataError = 
  | "ERR:NONE_RUNNING"   // No buses running
  | "ERR:NETWORK"        // Network error
  | "ERR:INVALID_ROUTE"  // Invalid route
  | null;                // No error
```

## Error Handling

### Error Messages

```typescript
// src/shared/utils/errorMessages.ts

function getBusErrorMessage(error: BusDataError): string
```

**Error Mappings:**

| Error Code | User Message |
|------------|--------------|
| `ERR:NONE_RUNNING` | 운행 중인 버스가 없습니다 |
| `ERR:NETWORK` | 네트워크 오류가 발생했습니다 |
| `ERR:INVALID_ROUTE` | 잘못된 노선 정보입니다 |
| `null` | (No error) |

### Error Classification

```typescript
function isWarningError(error: BusDataError): boolean
```

Determines if error should be displayed as warning (true) or info (false).

## Cache Management

### CacheManager

Generic cache with LRU eviction.

```typescript
class CacheManager<T> {
  constructor(maxSize: number = 100)
  
  // Get cached value
  get(key: string): T | null
  
  // Set cached value
  set(key: string, value: T): void
  
  // Check if key exists
  has(key: string): boolean
  
  // Delete specific key
  delete(key: string): void
  
  // Clear all cache
  clear(): void
  
  // Get or fetch with deduplication
  async getOrFetch(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T>
  
  // Get statistics
  getStats(): {
    size: number;
    maxSize: number;
    pendingRequests: number;
    utilizationPercent: number;
  }
}
```

**Usage Example:**

```typescript
const cache = new CacheManager<BusItem[]>(50);

// Get or fetch data
const buses = await cache.getOrFetch('route30', async () => {
  return await getBusLocationData('GWJ1000000001');
});

// Check cache stats
const stats = cache.getStats();
console.log(`Cache: ${stats.size}/${stats.maxSize} (${stats.utilizationPercent}%)`);
```

## Utility Functions

### Geographic Utilities

```typescript
// src/shared/utils/geoUtils.ts

// Calculate distance between two points (km)
function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number

// Calculate bearing between two points (degrees)
function calculateBearing(
  A: [number, number],
  B: [number, number]
): number

// Project point onto line segment
function projectPointOnSegment(
  P: [number, number],
  A: [number, number],
  B: [number, number]
): [number, number]
```

### Data Formatters

```typescript
// src/shared/utils/formatters.ts

// Format arrival time
function formatArrivalTime(
  minutes: number,
  stopsAway?: number
): string

// Convert seconds to minutes
function secondsToMinutes(seconds: number): number

// Format vehicle type
function formatVehicleType(vehicleType: string): string
```

## Performance Monitoring

### performanceMonitor

Track operation performance.

```typescript
// src/shared/utils/performanceMonitor.ts

// Start timing
performanceMonitor.start('operation-name');

// End timing
const duration = performanceMonitor.end('operation-name');

// Measure async operation
const result = await performanceMonitor.measure('fetch-data', async () => {
  return await fetchData();
});

// Get statistics
const stats = performanceMonitor.getStats('operation-name');
// { count, avg, min, max }

// Get full report
const report = performanceMonitor.getReport();
```

## Rate Limiting

Rate limiting is handled at the AWS API Gateway level:

- **Default**: 3000ms between requests per route
- **Configurable**: Set via `NEXT_PUBLIC_API_REFRESH_INTERVAL`
- **Client-side**: Polling service respects interval
- **Server-side**: API Gateway enforces limits

## Best Practices

### 1. Always Use Cache

```typescript
// ✅ Good: Use cache
const buses = await cache.getOrFetch(key, fetchFn);

// ❌ Bad: Direct fetch
const buses = await getBusLocationData(routeId);
```

### 2. Handle Errors Gracefully

```typescript
try {
  const data = await fetchAPI('/endpoint');
} catch (error) {
  console.error('API error:', error);
  // Show user-friendly message
}
```

### 3. Type Everything

```typescript
// ✅ Good: Fully typed
const buses: BusItem[] = await getBusLocationData(id);

// ❌ Bad: Any type
const buses: any = await getBusLocationData(id);
```

### 4. Monitor Performance

```typescript
await performanceMonitor.measure('expensive-op', async () => {
  // expensive operation
});
```

---

**Last Updated**: December 2024
