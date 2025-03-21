// src/components/MapWrapper.tsx

"use client";

import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./Map"), { ssr: false });

type MapWrapperProps = {
  routeId: string;
};

export default function MapWrapper({ routeId }: MapWrapperProps) {
  return <DynamicMap routeId={routeId} />;
}
