// src/app/layout.tsx

import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { MapProvider } from "@/context/MapContext";
import { Geist, Geist_Mono } from "next/font/google";

// Google Fonts 설정 (Geist Sans, Geist Mono)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 페이지 메타데이터
export const metadata = {
  title: "YMove",
  description: "연세대 미래캠퍼스 버스 실시간 위치 및 시간표 시스템",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// 뷰포트 및 기타 메타 정보 설정
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
  themeColor: "#003876",
  colorScheme: "light",
};

// RootLayout 컴포넌트: 전역 스타일, MapProvider, SpeedInsights, Analytics 등을 포함합니다.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 전역 지도 컨텍스트를 제공하는 MapProvider */}
        <MapProvider>{children}</MapProvider>
        {/* Vercel SpeedInsights와 Analytics 컴포넌트 */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
