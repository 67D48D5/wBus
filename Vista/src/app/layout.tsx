// src/app/layout.tsx

import "@styles/globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { MapProvider } from "@map/context/MapContext";
import { Geist, Geist_Mono } from "next/font/google";

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
  description: "원주 실시간 시내버스 시각화 서비스",
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
  themeColor: "#003876",
  colorScheme: "light",
};

// RootLayout is the main layout component that wraps around all pages.
// It includes global styles, the MapProvider for map context, and analytics components.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Provides global map context via MapProvider */}
        <MapProvider>{children}</MapProvider>
        {/* Vercel SpeedInsights and Analytics components */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
