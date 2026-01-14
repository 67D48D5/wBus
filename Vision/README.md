# Vision

Frontend for the `wBus` project (Next.js 15 + React 19).

## Quick Start

```bash
# Navigate to the Vision
cd Vision

# Run the development server
npm install && npm run dev
```

## Map Loading & Performance

- **Map style caching**: Map style JSON is fetched once and reused across mounts to reduce repeat network calls.
- **Canvas rendering preference**: Leaflet is configured to prefer canvas rendering for smoother marker performance on dense routes.
- **SSR-safe map loading**: The live map is dynamically imported to avoid server-side rendering errors.
- **Cleanup on unmount**: MapLibre layers are removed on teardown to prevent stale layers or memory leaks.
