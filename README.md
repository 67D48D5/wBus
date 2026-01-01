# wBus

> **원주 시내버스 정보 서비스 / Wonju City Bus Information Service**

A modern, responsive web application for Wonju city buses featuring real-time location tracking and comprehensive schedule information. Built with Next.js, React, TypeScript, and Leaflet.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

## ✨ Features

### 🗺️ Real-time Bus Tracking (`/live`)
- Live bus location tracking on an interactive map
- Real-time position updates with smooth animations
- Bus stop information and arrival estimates
- Click on buses for detailed route information
- Automatic data refresh

### 📅 Bus Schedule & Timetable (`/schedule`)
- Complete bus schedules for all routes
- Weekday and weekend timetables
- Departure time information
- Major bus stop listings

### 💡 Additional Features
- 📱 **Responsive Design**: Optimized for mobile, tablet, and desktop
- 🌙 **Dark Mode Support**: Comfortable viewing in any lighting condition
- ⚡ **Performance Optimized**: Efficient caching and memory management
- 🎨 **Modern UI**: Clean interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/67D48D5/wBus.git
cd wBus

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API settings

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🏗️ Technology Stack

### Core
- **[Next.js 15.2](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://reactjs.org/)** - UI library  
- **[TypeScript 5.x](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework

### Mapping
- **[Leaflet 1.9](https://leafletjs.com/)** - Interactive maps
- **[React Leaflet 5](https://react-leaflet.js.org/)** - React bindings for Leaflet
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Map tiles

### Additional Tools
- **[lucide-react](https://lucide.dev/)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support
- **[Vercel Analytics](https://vercel.com/analytics)** - Analytics and insights

## 📁 Project Structure

```
wBus/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── live/              # Real-time bus tracking page
│   │   ├── schedule/          # Bus schedule/timetable pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── core/                   # Core infrastructure
│   │   ├── api/               # API client utilities
│   │   ├── cache/             # Cache management
│   │   └── constants/         # App-wide constants
│   └── features/               # Feature modules
│       ├── live/              # Live tracking features
│       └── schedule/          # Schedule features
├── public/                     # Static assets
│   ├── data/                  # Static data files (routes, schedules)
│   └── icons/                 # App icons
└── ...config files
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Live API Settings
NEXT_PUBLIC_API_URL=https://your-api-gateway.execute-api.ap-northeast-2.amazonaws.com

# Remote Data Configuration (for schedules, routes, etc.)
NEXT_PUBLIC_USE_REMOTE_DATA=false
NEXT_PUBLIC_DATA_URL=
```

See `.env.example` for the complete configuration template.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Bus data provided by [공공데이터포털](https://www.data.go.kr/) (Korea Public Data Portal)
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/) contributors
- Built for the Wonju city community

## 📞 Support

For issues, questions, or feature requests, please open an issue on [GitHub Issues](https://github.com/67D48D5/wBus/issues).

---

**Made with ❤️ for Wonju City**
