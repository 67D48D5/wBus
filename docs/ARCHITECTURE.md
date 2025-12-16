# wBus Architecture Documentation

This document provides a comprehensive overview of the wBus application architecture, design patterns, and implementation details.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Directory Structure](#directory-structure)
- [Core Components](#core-components)
- [Design Patterns](#design-patterns)
- [Data Flow](#data-flow)
- [Performance Optimizations](#performance-optimizations)
- [Security Considerations](#security-considerations)

## Overview

wBus is built using a modern React-based architecture with Next.js 15 (App Router), featuring:

- **Feature-based organization**: Code organized by features, not file types
- **Service layer pattern**: Business logic separated from UI components
- **Centralized caching**: Unified cache management with LRU eviction
- **Type safety**: Full TypeScript coverage with strict mode
- **Performance optimizations**: Memoization, lazy loading, and efficient re-rendering

### Technology Stack

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
│  Next.js 15 + React 19 + TypeScript + Tailwind CSS │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                 Application Layer                    │
│    Components │ Hooks │ Services │ Utils            │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   Data Layer                         │
│     API Client │ Cache Manager │ State Management   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                External Services                     │
│      AWS API Gateway │ Public Data Portal           │
└─────────────────────────────────────────────────────┘
```

## System Architecture

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      Browser / Client                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │    Map      │  │  Bus List   │  │   NavBar    │       │
│  │  Component  │  │  Component  │  │  Component  │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│  ┌────────────────────────▼──────────────────────────┐    │
│  │           React Context (MapProvider)             │    │
│  └────────────────────────┬──────────────────────────┘    │
│                           │                                │
│  ┌────────────────────────▼──────────────────────────┐    │
│  │              Business Logic Layer                  │    │
│  │  ┌──────────────────┐  ┌────────────────────┐     │    │
│  │  │ BusPollingService│  │   Custom Hooks     │     │    │
│  │  └────────┬─────────┘  └─────────┬──────────┘     │    │
│  └───────────┼──────────────────────┼────────────────┘    │
│              │                      │                      │
│  ┌───────────▼──────────────────────▼────────────────┐    │
│  │              Core Infrastructure                   │    │
│  │  ┌─────────────┐  ┌──────────────┐               │    │
│  │  │CacheManager │  │  API Client  │               │    │
│  │  └──────┬──────┘  └──────┬───────┘               │    │
│  └─────────┼─────────────────┼──────────────────────┘    │
└────────────┼─────────────────┼───────────────────────────┘
             │                 │
             │  ┌──────────────▼────────────────┐
             │  │      AWS API Gateway          │
             │  │  (Caching + Rate Limiting)    │
             │  └──────────────┬────────────────┘
             │                 │
             │  ┌──────────────▼────────────────┐
             │  │   Public Data Portal API      │
             │  │  (Real-time Bus Data)         │
             │  └───────────────────────────────┘
             │
             │  ┌───────────────────────────────┐
             │  │      Static Data Files        │
             └─▶│  (Route Maps, Polylines)      │
                └───────────────────────────────┘
```

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Main application page
│   └── globals.css              # Global styles
│
├── core/                         # Core infrastructure
│   ├── api/
│   │   └── fetchAPI.ts          # Base API client
│   ├── cache/
│   │   └── CacheManager.ts      # Centralized cache with LRU
│   └── constants/
│       └── env.ts               # Environment configuration
│
├── features/                     # Feature modules
│   ├── bus/                     # Bus tracking feature
│   │   ├── api/                 # Bus-specific API calls
│   │   │   ├── getRealtimeData.ts
│   │   │   ├── getRouteMap.ts
│   │   │   ├── getPolyline.ts
│   │   │   └── getSchedule.ts
│   │   ├── components/          # Bus UI components
│   │   │   ├── BusList.tsx      # Bus list display
│   │   │   ├── BusMarker.tsx    # Map marker for bus
│   │   │   ├── BusStopMarker.tsx
│   │   │   └── BusRoutePolyline.tsx
│   │   ├── hooks/               # Bus-related hooks
│   │   │   ├── useBusLocation.ts
│   │   │   ├── useBusStop.ts
│   │   │   ├── useBusDirection.ts
│   │   │   ├── useBusData.ts
│   │   │   └── useSortedBusList.ts
│   │   ├── services/            # Business logic
│   │   │   └── BusPollingService.ts
│   │   ├── types/               # TypeScript types
│   │   │   ├── data.ts
│   │   │   └── error.ts
│   │   └── utils/               # Bus utilities
│   │       └── getSnappedPos.ts
│   │
│   └── map/                     # Map feature
│       ├── components/
│       │   ├── Map.tsx          # Main map component
│       │   ├── MapWrapper.tsx   # Map wrapper with lazy loading
│       │   └── RotatedMarker.tsx
│       ├── context/
│       │   └── MapContext.tsx   # Map instance context
│       └── hooks/
│           └── useIcons.ts      # Map icon management
│
└── shared/                       # Shared utilities
    ├── components/              # Reusable components
    │   ├── Splash.tsx          # Loading splash screen
    │   ├── NavBar.tsx          # Navigation bar
    │   └── ErrorBoundary.tsx   # Error boundary
    ├── types/
    │   └── common.ts           # Common TypeScript types
    └── utils/                   # Utility functions
        ├── formatters.ts        # Data formatting
        ├── errorMessages.ts     # Error handling
        ├── directionIcons.ts    # Direction display
        ├── geoUtils.ts          # Geographic calculations
        └── performanceMonitor.ts # Performance tracking
```

## Core Components

### 1. CacheManager

**Purpose**: Centralized caching with automatic memory management

**Features**:
- LRU (Least Recently Used) eviction
- Request deduplication
- Access time tracking
- Configurable size limits
- Statistics API

**Usage**:
```typescript
const cache = new CacheManager<DataType>(maxSize);
const data = await cache.getOrFetch(key, fetchFunction);
```

### 2. BusPollingService

**Purpose**: Manages bus location polling and subscriptions

**Features**:
- Singleton pattern
- Subscription-based updates
- Automatic cleanup
- Error handling
- Visibility-aware polling

**Architecture**:
```typescript
class BusPollingService {
  private cache: Record<string, BusItem[]>
  private dataListeners: Record<string, Set<Listener>>
  private intervals: Record<string, Timer>
  
  subscribe(route, onData, onError): unsubscribe
  startPolling(route): cleanup
  stopPolling(route): void
}
```

### 3. MapContext

**Purpose**: Provides map instance to child components

**Benefits**:
- Avoids prop drilling
- Centralized map access
- Type-safe context

```typescript
const { map } = useMapContext();
map?.flyTo([lat, lng], zoom);
```

## Design Patterns

### 1. **Feature-Based Organization**

Code is organized by features, not file types:

```
✅ Good: features/bus/components/BusList.tsx
❌ Bad: components/BusList.tsx
```

Benefits:
- Better code locality
- Easier to find related code
- Clearer dependencies
- Simpler to extract features

### 2. **Service Layer Pattern**

Business logic separated from UI:

```
Components → Hooks → Services → API
```

Example:
```typescript
// Component uses hook
const { data } = useBusLocationData(route);

// Hook uses service
busPollingService.subscribe(route, onData, onError);

// Service uses API
const data = await getBusLocationData(routeId);
```

### 3. **Repository Pattern**

API functions organized by domain:

```
features/bus/api/
├── getRealtimeData.ts   # Bus location API
├── getRouteMap.ts       # Route configuration
└── getPolyline.ts       # Route geometry
```

### 4. **Custom Hooks Pattern**

Reusable logic encapsulated in hooks:

```typescript
// Composite hook
function useBusData(route) {
  const location = useBusLocationData(route);
  const direction = useBusDirection(route);
  const polyline = usePolyline(route);
  return { ...location, direction, polyline };
}
```

### 5. **Singleton Services**

Shared services instantiated once:

```typescript
export const busPollingService = new BusPollingService();
export const performanceMonitor = new PerformanceMonitor();
```

## Data Flow

### Bus Location Updates

```
1. App mounts
   └─▶ page.tsx useEffect triggers

2. Start polling
   └─▶ busPollingService.startPolling(route)
       ├─▶ Fetch data immediately
       └─▶ Set interval for periodic updates

3. Data fetched
   └─▶ getRouteMap() → get vehicle IDs
       └─▶ getBusLocationData(vehicleId) for each
           └─▶ API call through fetchAPI
               └─▶ Data processed and cached

4. Data distributed
   └─▶ busPollingService notifies subscribers
       └─▶ useBusLocationData receives update
           └─▶ Component re-renders with new data

5. UI updates
   └─▶ BusList shows updated buses
   └─▶ BusMarker positions update on map
   └─▶ Smooth animations applied
```

### Cache Flow

```
Request → CacheManager.getOrFetch()
           ├─▶ Cache hit? → Return cached data
           ├─▶ Pending request? → Return promise
           └─▶ New request
               ├─▶ Execute fetch function
               ├─▶ Store in cache
               ├─▶ Update access time
               └─▶ Evict LRU if over limit
```

## Performance Optimizations

### 1. **Memoization**

```typescript
// Expensive calculations memoized
const sortedList = useMemo(() => {
  return [...buses].sort(compareFn);
}, [buses, compareFn]);

// Callbacks stable across renders
const handleClick = useCallback((id) => {
  // handle click
}, [dependencies]);
```

### 2. **Component Memoization**

```typescript
// Prevent re-render if props haven't changed
const BusMarker = React.memo(({ bus }) => {
  return <Marker position={[bus.lat, bus.lng]} />;
});
```

### 3. **Request Deduplication**

Multiple concurrent requests for same data resolved with single fetch:

```typescript
// Both calls resolved by single fetch
Promise.all([
  cache.getOrFetch('route30', fetch),
  cache.getOrFetch('route30', fetch)
]);
```

### 4. **Lazy Loading**

Map loaded only on client-side:

```typescript
// Dynamic import with no SSR
const MapWrapper = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

### 5. **LRU Cache Eviction**

Automatic memory management:

```typescript
const cache = new CacheManager(100); // Max 100 items
// Oldest unused items automatically removed
```

## Security Considerations

### 1. **XSS Prevention**

```typescript
// HTML escaped before rendering
const escapeHtml = (text: string) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
```

### 2. **Environment Variables**

Sensitive data in environment variables:

```bash
# Never commit .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
```

### 3. **API Gateway**

Rate limiting and caching at API Gateway level:

```
Client → API Gateway → Public API
         (Rate limit)
         (Cache)
```

### 4. **Type Safety**

Full TypeScript coverage prevents runtime errors:

```typescript
interface BusItem {
  vehicleno: string;
  gpslati: number;
  gpslong: number;
  // ... strict types
}
```

## Best Practices

### 1. **Code Organization**

- Group related files together
- Use index files for exports
- Keep components small and focused

### 2. **State Management**

- Use React Context for global state
- Local state for component-specific data
- Services for business logic

### 3. **Error Handling**

- Use Error Boundaries
- Provide user-friendly error messages
- Log errors for debugging

### 4. **Performance**

- Profile with React DevTools
- Monitor with performanceMonitor
- Optimize re-renders with memo

### 5. **Testing** (To be implemented)

- Unit tests for utilities
- Integration tests for services
- E2E tests for critical flows

## Future Improvements

- [ ] Add comprehensive test coverage
- [ ] Implement service workers for offline mode
- [ ] Add error reporting service
- [ ] Implement analytics
- [ ] Add A/B testing framework
- [ ] Optimize bundle size further
- [ ] Add progressive web app features

---

**Last Updated**: December 2024
**Version**: 2.0
