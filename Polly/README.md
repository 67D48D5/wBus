# Polly

Polly is the data pipeline for `wBus`. It collects route shapes from the TAGO public API,
snaps them to real road geometry with OSRM, and crawls static schedules from the Wonju bus
information site. The output is ready-to-serve GeoJSON and JSON for the rest of the stack.

## What It Does

- Route collection: fetches route lists and stop sequences from the TAGO API.
- Route snapping: converts raw stop-to-stop paths into road-aligned geometry via OSRM.
- Schedule crawling: parses the Wonju schedule tables into structured JSON.
- Packaging: writes a compact `routeMap.json` and per-route schedule files.

## Requirements

- Rust (edition 2024)
- TAGO service key (DATA_GO_KR_SERVICE_KEY)
- OSRM backend (local recommended)
- Network access to `its.wonju.go.kr` for schedule crawling

## Setup

```bash
cd Polly
cp .env.example .env
```

Fill in `.env` with your decoded TAGO service key.
If you want a local routing backend, follow `OSRM.md`.

## Usage

### Route Processor

Collects routes and generates a station map. Optionally snaps routes using OSRM.

```bash
# All routes for the default city code (Wonju 32020)
cargo run -- route

# Only one route number
cargo run -- route --route 2

# Only build routeMap.json (skip snapping)
cargo run -- route --station-map-only

# Only snap existing raw routes (skip TAGO)
cargo run -- route --osrm-only
```

Key flags:

- `--city-code` (default: `32020`)
- `--route` (filter by route number)
- `--output-dir` (default: `./storage/processed_routes`)
- `--station-map-only`
- `--osrm-only`

### Schedule Processor

Crawls the Wonju schedule site and writes structured JSON.

```bash
# All schedules
cargo run -- schedule

# Single route number
cargo run -- schedule --route 2
```

## Output Layout

```text
storage/
  processed_routes/
    raw_routes/        # GeoJSON from TAGO
    snapped_routes/    # OSRM-snapped GeoJSON
    routeMap.json      # stop map + route metadata
  schedules/
    2.json
```

## Environment Variables

- `DATA_GO_KR_SERVICE_KEY` (required for TAGO collection)
- `TAGO_API_URL` (default: `http://apis.data.go.kr/1613000/BusRouteInfoInqireService`)
- `OSRM_ROUTE_API_URL` (default: `http://router.project-osrm.org/route/v1/driving`)

## Notes

- `OSRM` requests are chunked to avoid URL length limits on public servers.
- Coordinates are filtered to the South Korea bounding box to drop outliers.
- The schedule crawler mimics a browser session; HTML changes may require tweaks.
