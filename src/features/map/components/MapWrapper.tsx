// src/features/map/components/MapWrapper.tsx

"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the Map component to avoid server-side rendering issues
const DynamicMap = dynamic(() => import("./Map"), { ssr: false });

type MapWrapperProps = {
  routeName: string;
};

// MapWrapper component that wraps the dynamic Map component
const MapWrapper: React.FC<MapWrapperProps> = ({ routeName }) => {
  return <DynamicMap routeName={routeName} />;
};

export default MapWrapper;
