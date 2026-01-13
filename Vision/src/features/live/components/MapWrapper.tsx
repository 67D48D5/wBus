// src/features/live/components/MapWrapper.tsx

"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the Map component to avoid server-side rendering issues
const DynamicMap = dynamic(() => import("./Map"), { ssr: false });

type MapWrapperProps = {
  routeNames: string[];
  onReady?: () => void;
};

// MapWrapper component that wraps the dynamic Map component
const MapWrapper: React.FC<MapWrapperProps> = ({ routeNames, onReady }) => {
  return <DynamicMap routeNames={routeNames} onReady={onReady} />;
};

export default MapWrapper;
