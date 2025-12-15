# wBus Architecture Documentation

## Overview

wBus is a Next.js-based web application that visualizes real-time bus information for Wonju, South Korea. The application follows a feature-based architecture with clear separation of concerns.

## Directory Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with global providers
│   └── page.tsx           # Main home page
├── core/                   # Core infrastructure and utilities
│   ├── api/               # Core API utilities
│   │   └── fetchAPI.ts    # HTTP client with retry logic
│   ├── cache/             # Cache management system
│   │   └── CacheManager.ts # Generic cache manager
│   └── constants/         # Application-wide constants
│       └── env.ts         # Environment variables and configuration
├── features/              # Feature modules
│   ├── bus/              # Bus tracking feature
│   │   ├── api/          # Bus data API calls
│   │   ├── components/   # Bus-related UI components
│   │   ├── hooks/        # Bus-related React hooks
│   │   ├── services/     # Bus business logic services
│   │   ├── types/        # Bus data types and interfaces
│   │   └── utils/        # Bus utility functions
│   └── map/              # Map display feature
│       ├── components/   # Map UI components
│       ├── context/      # Map context provider
│       └── hooks/        # Map-related hooks
└── shared/               # Shared components and utilities
    ├── components/       # Reusable UI components
    └── styles/           # Global styles
```

## Key Architectural Decisions

### 1. Feature-Based Organization

The codebase is organized by features (`bus`, `map`) rather than by technical layers. This makes it easier to understand and maintain related functionality.

### 2. Cache Management

A centralized `CacheManager` class handles all caching needs across the application:
- Prevents duplicate network requests
- Provides consistent API for cache operations
- Supports automatic request deduplication

### 3. Service Layer

Business logic is encapsulated in service classes (e.g., `BusPollingService`):
- Manages complex state and side effects
- Provides clean API for components and hooks
- Handles polling, subscriptions, and cleanup

### 4. Type Safety

TypeScript is used throughout with:
- Strict type checking enabled
- Explicit types for API responses
- Type-safe error handling

### 5. Error Handling

Standardized error types provide predictable error handling:
- `BusDataError` type for bus-related errors
- Custom `HttpError` class for API errors
- Consistent error propagation

## Data Flow

### Bus Location Updates

1. **Page Component** (`page.tsx`)
   - Starts polling via `BusPollingService`
   
2. **BusPollingService** (`services/BusPollingService.ts`)
   - Fetches data at regular intervals
   - Manages cache and notifies listeners
   - Handles errors and edge cases

3. **React Hooks** (`hooks/useBusLocation.ts`)
   - Subscribe to service updates
   - Provide data to components
   - Manage component lifecycle

4. **Components** (`components/BusList.tsx`, etc.)
   - Consume hook data
   - Render UI
   - Handle user interactions

### Map Context

The `MapContext` provides global access to the Leaflet map instance:
- Initialized in `MapProvider` (layout.tsx)
- Accessed via `useMapContext` hook
- Allows components to interact with the map

## Best Practices

### Components
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract complex logic to custom hooks or services

### Hooks
- Follow React hooks rules
- Handle cleanup in useEffect
- Avoid side effects in render

### API Calls
- Use `fetchAPI` for HTTP requests
- Implement proper error handling
- Cache responses where appropriate

### State Management
- Use local state for UI state
- Use context for shared state (map instance)
- Use services for complex state (polling)

## Configuration

Environment variables are centralized in `src/core/constants/env.ts`:
- API endpoints and refresh intervals
- Map configuration (bounds, zoom, etc.)
- Feature flags and special cases

## Performance Considerations

1. **Request Deduplication**: `CacheManager` prevents duplicate concurrent requests
2. **Polling Optimization**: Polling pauses when page is not visible
3. **Dynamic Imports**: Map components are lazy-loaded to reduce initial bundle size
4. **Memoization**: React hooks use `useMemo` and `useCallback` where appropriate

## Future Improvements

Potential areas for enhancement:
- Add unit tests for core utilities and hooks
- Implement error boundary components
- Add offline support with service workers
- Optimize bundle size with code splitting
- Add performance monitoring
