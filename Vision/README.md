# Vision Module

Frontend for the wBus project (Next.js 15 + React 19).

## Quick Start

```bash
cd Vision
npm install
npm run dev
```

## Map Loading & Performance

- **Map style caching**: Map style JSON is fetched once and reused across mounts to reduce repeat network calls.
- **Canvas rendering preference**: Leaflet is configured to prefer canvas rendering for smoother marker performance on dense routes.
- **SSR-safe map loading**: The live map is dynamically imported to avoid server-side rendering errors.
- **Cleanup on unmount**: MapLibre layers are removed on teardown to prevent stale layers or memory leaks.

## Directory Highlights

- `src/features/live/components/Map.tsx`: Map container and MapLibre base layer setup.
- `src/features/live/api/getStaticData.ts`: Cached fetch for route maps, polylines, and map styles.
