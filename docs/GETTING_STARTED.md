# Getting Started with wBus

This guide will help you set up and run the wBus application on your local machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Understanding the Interface](#understanding-the-interface)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** (v20.x or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **npm** (v10.x or higher)
  - Comes with Node.js
  - Verify installation: `npm --version`

### Optional Tools

- **Git** - For cloning the repository
- **VS Code** - Recommended IDE with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/67D48D5/wBus.git
cd wBus
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages defined in `package.json`:
- Next.js framework
- React and React DOM
- Leaflet and React Leaflet for maps
- TypeScript and type definitions
- Tailwind CSS
- Other dependencies

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Required: Your API Gateway URL
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.com

# Optional: Customize these as needed
NEXT_PUBLIC_API_REFRESH_INTERVAL=3000
NEXT_PUBLIC_MAP_DEFAULT_POSITION=37.28115,127.901946
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12
```

**Important**: The `NEXT_PUBLIC_API_URL` must point to a valid API gateway that provides bus location data.

## Configuration

### Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API Gateway endpoint URL | Required |
| `NEXT_PUBLIC_API_REFRESH_INTERVAL` | Data refresh interval (ms) | 3000 |
| `NEXT_PUBLIC_APP_NAME` | Application name | wBus |
| `NEXT_PUBLIC_MAP_DEFAULT_POSITION` | Initial map center (lat,lng) | 37.28115,127.901946 |
| `NEXT_PUBLIC_MAP_DEFAULT_ZOOM` | Initial zoom level | 12 |
| `NEXT_PUBLIC_MAP_MIN_ZOOM` | Minimum zoom level | 12 |
| `NEXT_PUBLIC_MAP_MAX_ZOOM` | Maximum zoom level | 19 |
| `NEXT_PUBLIC_MAP_MAX_BOUNDS` | Map boundary limits | 37.22,127.8,37.52,128.05 |

### Map Configuration

The default map is centered on Wonju, South Korea. To change the default location:

```env
# Format: latitude,longitude
NEXT_PUBLIC_MAP_DEFAULT_POSITION=37.28115,127.901946

# Format: swLat,swLng,neLat,neLng
NEXT_PUBLIC_MAP_MAX_BOUNDS=37.22,127.8,37.52,128.05
```

## Running the Application

### Development Mode

Start the development server with hot-reloading:

```bash
npm run dev
```

The application will be available at:
- Local: http://localhost:3000
- Network: http://[your-ip]:3000

**Development Features:**
- Hot Module Replacement (HMR)
- Detailed error messages
- React DevTools support
- Performance warnings in console

### Production Build

Create an optimized production build:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

The production build includes:
- Minified JavaScript and CSS
- Optimized images
- Static page generation where possible
- Reduced bundle sizes

### Linting

Check code quality:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint -- --fix
```

## Understanding the Interface

### Main Components

#### 1. **Map View**
- **Pan**: Click and drag to move around
- **Zoom**: Use mouse wheel or pinch gesture
- **Bus Markers**: Click on any bus icon to see details
- **Bus Stops**: Visible at zoom level 15+

#### 2. **Bus List Panel** (Bottom Left)
- Shows all active buses across routes
- Displays bus number and current location
- Click any bus to center map on its location
- Automatically sorted by distance from map center

#### 3. **My Location Button** (Bottom Right)
- Click to center map on your current location
- Requires browser location permission

#### 4. **Navigation Bar** (Top)
- Application branding
- Route selection (if implemented)

### Bus Status Icons

| Icon | Direction | Description |
|------|-----------|-------------|
| ⬆️ | Upward | Bus traveling in upward direction |
| ⬇️ | Downward | Bus traveling in downward direction |

### Color Coding

- **Blue**: Normal operation
- **Red**: Error state
- **Yellow/Amber**: Warning state
- **Gray**: Inactive or loading

## Troubleshooting

### Common Issues

#### 1. **Application Won't Start**

```
Error: Cannot find module 'next'
```

**Solution**: Install dependencies
```bash
npm install
```

#### 2. **Map Not Loading**

**Possible Causes:**
- Network connection issues
- Firewall blocking OpenStreetMap
- Browser ad-blocker interfering

**Solutions:**
- Check your internet connection
- Disable ad-blockers for localhost
- Check browser console for errors

#### 3. **No Bus Data Showing**

```
Error: 버스 데이터를 불러오는 중...
```

**Possible Causes:**
- Incorrect API URL in `.env.local`
- API Gateway is down
- No buses currently running

**Solutions:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check API Gateway status
- Try refreshing the page

#### 4. **Build Fails**

```
Error: Failed to compile
```

**Solutions:**
- Delete `.next` folder: `rm -rf .next`
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `rm -rf node_modules && npm install`

#### 5. **Port Already in Use**

```
Error: Port 3000 is already in use
```

**Solution**: Use a different port
```bash
PORT=3001 npm run dev
```

### Debug Mode

Enable verbose logging in development:

```bash
NODE_ENV=development DEBUG=* npm run dev
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Architecture Documentation](./ARCHITECTURE.md)
2. Review [Development Guide](./DEVELOPMENT.md)
3. Search [GitHub Issues](https://github.com/67D48D5/wBus/issues)
4. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

## Next Steps

Now that you have wBus running:

1. **Explore the Code**: Check out the [Architecture Guide](./ARCHITECTURE.md)
2. **Contribute**: Read the [Development Guide](./DEVELOPMENT.md)
3. **Deploy**: See the [Deployment Guide](./DEPLOYMENT.md)
4. **Customize**: Modify the app for your needs

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Happy coding! 🚀**
