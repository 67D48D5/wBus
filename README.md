# wBus

> A comprehensive, modern web application for real-time bus tracking, schedules, and route information in Wonju city.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.x-blue)](https://www.python.org/)

---

## Table of Contents

- [Features](#features)
- [Project Architecture](#project-architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development](#development)
- [Data Processing](#data-processing)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Bus Schedule & Timetable

- Complete, comprehensive bus schedules for all Wonju routes
- Separated weekday, weekend, and holiday timetables
- Precise departure times and intervals
- Major bus stop listings with route information
- Search functionality for routes and stops

### Real-time Bus Tracking (/live)

- **Live bus location tracking** on interactive Leaflet map
- **Real-time position updates** with smooth animations
- Bus stop information and estimated arrival times
- Route details on bus click
- Automatic data refresh (configurable intervals)
- Multi-route filtering and visualization
- Mobile-optimized interface

### Additional Features

- **Responsive Design**: Fully optimized for mobile, tablet, and desktop
- **Performance Optimized**: Intelligent caching, memory management, and lazy loading
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Data Processing Pipeline**: Automated route and schedule processing
- **Geospatial Processing**: Route snapping and optimization using spatial data
- **Type-Safe**: Full TypeScript coverage across frontend and data processing

---

## Project Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    wBus Full Stack                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Vision/)           Backend (Polly/)               │
│  ├─ Next.js 15                ├─ Python Data Pipeline        │
│  ├─ React 19                  ├─ Route Processing            │
│  ├─ TypeScript                ├─ Schedule Processing         │
│  ├─ Leaflet + OpenStreetMap   ├─ Geospatial Analysis         │
│  └─ TailwindCSS               └─ GeoJSON Handling            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Data Layer (storage/)                                       │
│  ├─ raw_routes/      (Raw GeoJSON route files)               │
│  ├─ snapped_routes/  (Processed route data)                  │
│  ├─ schedules/       (Bus schedule JSON)                     │
│  └─ routeMap.json    (Master route registry)                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technologies |
| ----- | ------------ |
| **Frontend** | Next.js 15, React 19, TypeScript, Leaflet, TailwindCSS |
| **Backend** | Python 3.x, GeoJSON processing, Spatial analysis |
| **Data** | GeoJSON, JSON, Static files |
| **Deployment** | CloudFront, Static hosting |

---

## Project Structure

```shell
wBus/
├── Vision/                         # Frontend Application (Next.js)
│   ├── src/
│   │   ├── app/                    # Next.js app directory
│   │   │   ├── page.tsx            # Home page
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── live/               # Live tracking page
│   │   │   ├── [id]/               # Dynamic route details
│   │   │   └── globals.css         # Global styles
│   │   ├── core/                   # Core utilities
│   │   │   ├── api/                # API integration
│   │   │   ├── cache/              # Caching utilities
│   │   │   └── constants/          # Constants and config
│   │   └── features/               # Feature components
│   │       ├── live/               # Live tracking features
│   │       └── schedule/           # Schedule features
│   ├── public/                     # Static assets
│   │   ├── data/                   # Static data files
│   │   │   ├── notice.json         # Notices
│   │   │   ├── routeMap.json       # Route mapping
│   │   │   ├── polylines/          # Polyline data
│   │   │   └── schedules/          # Schedule data
│   │   └── icons/                  # Icon assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── README.md
│
├── Polly/                          # Backend Data Processing
│   ├── src/
│   │   ├── BusRouteProcessor.py    # Route data processing
│   │   └── BusScheduleProcessor.py # Schedule data processing
│   ├── storage/
│   │   ├── processed_routes/       # Processed route output
│   │   │   ├── routeMap.json       # Master route registry
│   │   │   ├── raw_routes/         # Source route files (GeoJSON)
│   │   │   └── snapped_routes/     # Processed route data
│   │   └── schedules/              # Processed schedules
│   ├── API.md                      # Polly API documentation
│   └── README.md
│
├── README.md                       # This file
└── LICENSE                         # MIT License
```

---

## Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher (or yarn/pnpm)
- **Python** 3.x (for data processing in Polly)

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/67D48D5/wBus.git
cd wBus

# Install frontend dependencies
cd Vision
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration (see Configuration section below)

# Start development server
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
cd Vision

# Build for production
npm run build

# Start production server
npm start
```

### Available Frontend Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Create optimized production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint for code quality |

---

## Configuration

### Frontend Environment Variables

Create a `.env.local` file in the `Vision/` directory:

```env
# API Configuration
# Base URL for all API requests
# - Live API requests go to: NEXT_PUBLIC_API_URL
# - Static data served from: NEXT_PUBLIC_API_URL/static
NEXT_PUBLIC_API_URL=https://your-cloudfront-distribution.cloudfront.net

# Data Source Configuration
# Set to true to use remote data from CDN
# Set to false to use local/embedded data
NEXT_PUBLIC_USE_REMOTE_STATIC_DATA=false

# Optional: Analytics, logging, or other service URLs
# NEXT_PUBLIC_ANALYTICS_URL=
# NEXT_PUBLIC_LOG_LEVEL=info
```

See `.env.example` in the Vision directory for the complete configuration template.

### Backend Configuration

See [Polly/API.md](./Polly/API.md) and [Polly/README.md](./Polly/README.md) for data processing configuration.

---

## Development

### Code Organization

#### Frontend (Vision/)

- **`app/`** - Next.js 15 app directory with routes and pages
- **`core/`** - Shared utilities, API clients, and constants
- **`features/`** - Feature-specific components and logic

#### Backend (Polly/)

- **`BusRouteProcessor.py`** - Processes raw route GeoJSON files
- **`BusScheduleProcessor.py`** - Processes and formats bus schedules
- **`storage/`** - Input/output directory for data files

### Running Development Server

```bash
cd Vision
npm run dev
```

The application uses **Turbopack** for fast compilation and hot module reloading.

### Building for Production

```bash
cd Vision
npm run build
```

This creates an optimized build in the `.next/` directory.

---

## Data Processing

The **Polly** backend handles all data processing:

### Route Processing

- Reads raw GeoJSON files from `storage/raw_routes/`
- Applies geospatial analysis and route optimization
- Outputs processed routes to `storage/snapped_routes/`
- Generates master route registry (`routeMap.json`)

### Schedule Processing

- Processes bus schedules and timetables
- Formats schedules for frontend consumption
- Handles weekday/weekend/holiday distinctions
- Outputs to `storage/schedules/`

### Data Pipeline

```text
Raw Route Files (.geojson)
    ↓
BusRouteProcessor.py
    ↓
Route Snapping & Optimization
    ↓
Processed Routes + routeMap.json
    ↓
Frontend Integration
```

For detailed information, see [Polly/API.md](./Polly/API.md).

---

## API Reference

### Frontend API Endpoints

The frontend communicates with the live API for:

- **Real-time bus positions**
- **Route information**
- **Schedule data**

Base URL: `NEXT_PUBLIC_API_URL`

For detailed API documentation, refer to [Polly/API.md](./Polly/API.md).

### Static Data Files

Located in `Vision/public/data/`:

- `routeMap.json` - Master route registry
- `schedules/` - Bus schedule files
- `polylines/` - Pre-computed polyline data
- `notice.json` - Service notices

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Maintain code quality**:
   - Follow existing code style
   - Run `npm run lint` before committing
   - Use TypeScript for new frontend code
3. **Document changes**: Update README and relevant docs
4. **Test thoroughly**: Test on mobile and desktop
5. **Submit a pull request** with clear description

### Development Best Practices

- Use TypeScript for type safety
- Follow React hooks best practices
- Implement proper error handling
- Optimize for mobile-first experience
- Cache API responses appropriately

---

## License

This project is licensed under the **MIT License**.

See the [LICENSE](./LICENSE) file for full details.

### Third-Party Licenses

- Bus data provided by [공공데이터포털](https://www.data.go.kr/) (Korea Public Data Portal)
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/) contributors
- Map library: [Leaflet](https://leafletjs.com/)

---

## Acknowledgments

- **Data Source**: Korea Public Data Portal (공공데이터포털)
- **Mapping**: OpenStreetMap contributors and Leaflet team
- **Frontend Framework**: Next.js and React teams

---

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing documentation in [Vision/README.md](./Vision/README.md) and [Polly/README.md](./Polly/README.md)
- Review [Polly/API.md](./Polly/API.md) for API details
