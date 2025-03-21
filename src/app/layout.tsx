// src/app/layout.tsx

import "./globals.css";

import { MapProvider } from "@/context/MapContext";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ymccb",
  description: "연세대 미래캠퍼스 버스 실시간 위치 및 시간표 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MapProvider>{children}</MapProvider>
      </body>
    </html>
  );
}
