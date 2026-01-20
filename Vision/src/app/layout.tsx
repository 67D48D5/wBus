// src/app/layout.tsx

import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { MapContextProvider } from "@map/context/MapContext";

import { SITE_CONFIG } from "@core/config/env";

// Google Fonts (Geist Safns, Geist Mono)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Page Metadata
export const metadata = {
  title: "wBus",
  description: SITE_CONFIG.METADATA.DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// Set viewport properties
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
  viewportFit: "cover",
  themeColor: "#003876",
  colorScheme: "light",
};

// RootLayout is the main layout component that wraps around all pages.
// It includes global styles, the MapContextProvider for map context, and analytics components.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Provides global map context via MapContextProvider */}
          <MapContextProvider>{children}</MapContextProvider>
        </ThemeProvider>
        {/* Vercel SpeedInsights and Analytics components */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
