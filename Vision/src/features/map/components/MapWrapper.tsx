// src/features/map/components/MapWrapper.tsx

"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the Map component to avoid server-side rendering issues
const DynamicMap = dynamic(() => import("./Map"), { ssr: false });

type MapWrapperProps = {
  routeNames: string[];
  onReady?: () => void;
  onRouteChange?: (routeName: string) => void;
};

// MapWrapper component that wraps the dynamic Map component
const MapWrapper: React.FC<MapWrapperProps> = ({ routeNames, onReady, onRouteChange }) => {
  return (
    <DynamicMap
      routeNames={routeNames}
      onReady={onReady}
      onRouteChange={onRouteChange}
    />
  );
};

export default MapWrapper;
