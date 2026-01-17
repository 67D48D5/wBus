# wBus

> Real-time bus tracking and schedules for Wonju, powered by a Rust data pipeline and a Next.js frontend.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-2024%20edition-orange)](https://www.rust-lang.org/)

## Overview

wBus is split into two focused apps:

- **Vision** (`Vision/`): Next.js UI for live map + timetables.
- **Polly** (`Polly/`): Rust CLI that collects routes, snaps geometry, and crawls schedules.

Polly produces GeoJSON/JSON, and Vision consumes it either from `public/data` or a remote CDN.

## Quick Start

### Vision (Frontend)

Prereqs: Node.js 20+ and npm 10+

```bash
cd Vision
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

### Polly (Data Pipeline)

Prereqs: Rust toolchain + TAGO service key (OSRM recommended)

```bash
cd Polly
cp .env.example .env
# Edit DATA_GO_KR_SERVICE_KEY in .env

cargo run -- route
cargo run -- schedule
```

See `Polly/README.md` and `Polly/OSRM.md` for full details.

## Data Flow

```text
TAGO API + Wonju schedule site
    ↓
Polly (route + schedule)
    ↓
GeoJSON + JSON outputs
    ↓
Vision (local public/data or remote CDN)
```

Copy outputs for local dev:

```bash
cp Polly/storage/processed_routes/routeMap.json Vision/public/data/routeMap.json
cp -R Polly/storage/processed_routes/snapped_routes Vision/public/data/polylines
cp -R Polly/storage/schedules Vision/public/data/schedules
```

## Configuration

### Vision Environment Variables

Set these in `Vision/.env.local` (see `Vision/.env.local.example` and `Vision/.env.example`):

- `NEXT_PUBLIC_LIVE_API_URL` (required for live endpoints)
- `NEXT_PUBLIC_STATIC_API_URL` (base URL for static JSON)
- `NEXT_PUBLIC_USE_REMOTE_STATIC_DATA` (true to fetch static data remotely)
- `NEXT_PUBLIC_MAP_URL` (optional map style override)
- `NEXT_PUBLIC_MAP_FALLBACK_API_URL` (fallback map style)
- `REMOTE_API_URL` (server-side proxy target when using `/dev`)

### Polly Environment Variables

Set these in `Polly/.env`:

- `DATA_GO_KR_SERVICE_KEY` (required)
- `TAGO_API_URL` (optional override)
- `OSRM_ROUTE_API_URL` (optional override)

## Documentation

- `Vision/README.md` (frontend details)
- `Polly/README.md` (pipeline usage)
- `Polly/API.md` (API Gateway/CloudFront reference)
- `Polly/OSRM.md` (local OSRM setup)

## License

This project is licensed under the **MIT License**.

See [LICENSE](./LICENSE) for full details.

### Third-Party Licenses

- Bus data provided by [공공데이터포털](https://www.data.go.kr/) (Korea Public Data Portal)
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/) contributors
- Map library: [Leaflet](https://leafletjs.com/)
