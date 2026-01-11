import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Resolve CORS issues by proxying requests through Next.js server
  // Should be used in development only
  async rewrites() {
    // If not in development mode, no rewrites are needed
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    // If in development mode but environment variable is missing, warn the developer
    const remoteApiUrl = process.env.REMOTE_API_URL;
    if (!remoteApiUrl) {
      console.warn("⚠️ REMOTE_API_URL is not set in .env.local. Proxy will not work.");
      return [];
    }

    return [
      {
        source: '/dev/:path*',
        destination: `${remoteApiUrl}/:path*`,
      },
    ];
  }
};

export default nextConfig;
