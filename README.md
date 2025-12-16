# wBus 🚍

> **Real-time Bus Tracking Visualization Service for Wonju, South Korea**

A modern, responsive web application that provides real-time bus location tracking and arrival information for public transportation in Wonju. Built with Next.js, React, and Leaflet for an optimal user experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

## ✨ Features

- 🗺️ **Real-time Bus Tracking**: Live location updates for all active buses on multiple routes
- 📍 **Interactive Map**: Zoom, pan, and click on buses for detailed information
- 🚏 **Bus Stop Information**: View all bus stops with arrival time estimates
- 📱 **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- ⚡ **Performance Optimized**: Efficient caching, request deduplication, and memory management
- 🎯 **Auto-sorting**: Buses automatically sorted by distance from your current map view
- 🔄 **Auto-refresh**: Data automatically updates every 3 seconds
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/67D48D5/wBus.git
cd wBus

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API gateway URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## 📚 Documentation

- **[Getting Started](./docs/GETTING_STARTED.md)** - Setup and basic usage guide
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[API Reference](./docs/API_REFERENCE.md)** - API endpoints and data structures
- **[Development Guide](./docs/DEVELOPMENT.md)** - Contributing and development workflow
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deployment instructions for various platforms

## 🏗️ Technology Stack

### Core Technologies
- **[Next.js 15.5](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://reactjs.org/)** - UI library
- **[TypeScript 5.x](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework

### Mapping & Visualization
- **[Leaflet 1.9](https://leafletjs.com/)** - Interactive maps
- **[React Leaflet 5](https://react-leaflet.js.org/)** - React bindings for Leaflet
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Map tiles

### Infrastructure
- **[AWS API Gateway](https://aws.amazon.com/api-gateway/)** - API proxy and caching
- **[Vercel](https://vercel.com/)** - Deployment and hosting
- **[공공데이터포털](https://www.data.go.kr/)** - Korean public transportation data

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## 📁 Project Structure

```
wBus/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── core/                   # Core infrastructure
│   │   ├── api/               # API client utilities
│   │   ├── cache/             # Centralized cache management
│   │   └── constants/         # App-wide constants
│   ├── features/               # Feature modules
│   │   ├── bus/               # Bus tracking features
│   │   │   ├── api/          # Bus API functions
│   │   │   ├── components/   # Bus UI components
│   │   │   ├── hooks/        # Bus-related hooks
│   │   │   ├── services/     # Business logic services
│   │   │   ├── types/        # TypeScript types
│   │   │   └── utils/        # Bus utilities
│   │   └── map/               # Map features
│   │       ├── components/   # Map components
│   │       ├── context/      # Map context
│   │       └── hooks/        # Map hooks
│   └── shared/                 # Shared utilities
│       ├── components/        # Reusable components
│       ├── types/             # Shared types
│       └── utils/             # Utility functions
├── public/                     # Static assets
│   ├── data/                  # Static data files
│   └── icons/                 # App icons
├── docs/                       # Documentation
└── ...config files

```

## 🎯 Key Architectural Features

### 1. **Centralized Cache Management**
- Unified `CacheManager` class with LRU eviction
- Automatic request deduplication
- Memory-efficient storage with configurable limits

### 2. **Service Layer Pattern**
- `BusPollingService` for managing bus location polling
- Clean separation of business logic from UI components
- Lifecycle management for subscriptions and cleanup

### 3. **Optimized Rendering**
- Proper use of React.memo for expensive components
- useCallback and useMemo for performance optimization
- Dynamic hook usage without violating Rules of Hooks

### 4. **Geographic Utilities**
- Haversine distance calculation for accurate positioning
- Polyline snapping for smooth bus movements
- Bearing and angle calculations for proper icon rotation

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-gateway-url

# Refresh interval (milliseconds)
NEXT_PUBLIC_API_REFRESH_INTERVAL=3000

# Map Configuration
NEXT_PUBLIC_MAP_DEFAULT_POSITION=37.28115,127.901946
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12
NEXT_PUBLIC_MAP_MIN_ZOOM=12
NEXT_PUBLIC_MAP_MAX_ZOOM=19
NEXT_PUBLIC_MAP_MAX_BOUNDS=37.22,127.8,37.52,128.05

# Bus Stop Configuration
NEXT_PUBLIC_BUSSTOP_TARGET_NODE_IDS=WJB251036041
NEXT_PUBLIC_BUSSTOP_YONSEI_END_ROUTES=30,34
NEXT_PUBLIC_BUSSTOP_MARKER_MIN_ZOOM=15
NEXT_PUBLIC_ALWAYS_UPWARD_NODE_IDS=WJB251036041
```

See `.env.example` for all available options.

## 🤝 Contributing

Contributions are welcome! Please see our [Development Guide](./docs/DEVELOPMENT.md) for details on:

- Setting up the development environment
- Code style and conventions
- Submitting pull requests
- Testing guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Bus location data provided by [공공데이터포털](https://www.data.go.kr/)
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/) contributors
- Icons and design inspiration from the open-source community

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on [GitHub Issues](https://github.com/67D48D5/wBus/issues)
- Check our [documentation](./docs/)

## 🗺️ Roadmap

- [ ] Add support for more bus routes
- [ ] Implement route planning features
- [ ] Add notifications for bus arrivals
- [ ] Support for multiple cities
- [ ] Mobile app (React Native)
- [ ] Offline mode with service workers

---

**Built with ❤️ for Wonju commuters**
