// src/components/MapWrapper.tsx

"use client";

import dynamic from "next/dynamic";
import React from "react";

// 서버 사이드 렌더링을 비활성화한 동적 Map 컴포넌트
const DynamicMap = dynamic(() => import("./Map"), { ssr: false });

type MapWrapperProps = {
  routeName: string;
};

/**
 * MapWrapper 컴포넌트는 클라이언트 환경에서 동적 Map 컴포넌트를 렌더링합니다.
 * 이를 통해 Next.js의 서버 사이드 렌더링 시 발생할 수 있는 문제를 회피합니다.
 */
const MapWrapper: React.FC<MapWrapperProps> = ({ routeName }) => {
  return <DynamicMap routeName={routeName} />;
};

export default MapWrapper;
