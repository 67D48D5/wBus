# Vision

Vision is the frontend for `wBus` (Next.js 15 + React 19). It renders a live bus map,
schedule pages, and route-specific timetables backed by static JSON and real-time APIs.

## Highlights

- Live map with Leaflet + MapLibre base layer and animated bus markers.
- Route-aware polling service with caching and visibility-based refresh.
- Schedule-first UI: home page lists routes, detail pages render timetables.
- Static data can be local (`public/data`) or remote (S3/CloudFront).
- Map view and selected route persist via localStorage.

## Quick Start

```bash
cd Vision
npm install
```

Create `.env.local` with at least the live API base URL:

```bash
NEXT_PUBLIC_LIVE_API_URL="https://your-api.example.com"
```

Then run the dev server:

```bash
npm run dev
```

## Pages

- `/` schedules overview + notices
- `/[id]` route timetable
- `/live` real-time map

## Static Data Layout

Vision reads static files from `public/data` by default:

```text
public/data/
  mapStyle.json
  notice.json
  routeMap.json
  polylines/
  schedules/
```

These files are produced by `Polly` and can be synced to a remote bucket for CDN use.

## Environment Variables

Core:

- `NEXT_PUBLIC_LIVE_API_URL` (required for real-time endpoints)
- `NEXT_PUBLIC_STATIC_API_URL` (base URL for remote static assets)
- `NEXT_PUBLIC_USE_REMOTE_STATIC_DATA` (true to load static data remotely)
- `NEXT_PUBLIC_MAP_URL` (optional override for map style JSON)
- `NEXT_PUBLIC_MAP_FALLBACK_API_URL` (fallback map style)

Map behavior:

- `NEXT_PUBLIC_MAP_DEFAULT_POSITION`
- `NEXT_PUBLIC_MAP_DEFAULT_ZOOM`, `NEXT_PUBLIC_MAP_MIN_ZOOM`, `NEXT_PUBLIC_MAP_MAX_ZOOM`
- `NEXT_PUBLIC_BUS_STOP_MARKER_MIN_ZOOM`
- `NEXT_PUBLIC_MAP_FLY_TO_DURATION`, `NEXT_PUBLIC_BUS_ANIMATION_DURATION`
- `NEXT_PUBLIC_DEFAULT_ROUTE`

Server-side only:

- `REMOTE_API_URL` (used when `NEXT_PUBLIC_STATIC_API_URL` is a relative path)

## Map Loading & Performance

- Map style JSON is cached across mounts to reduce network load.
- Leaflet uses canvas rendering for smoother dense marker scenes.
- The map is dynamically imported to avoid SSR issues.
- MapLibre layers are removed on teardown to prevent memory leaks.
