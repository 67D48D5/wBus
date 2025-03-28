// src/components/NavBar.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouteMap } from "@/hooks/useRouteMap";

type NavBarProps = {
  onRouteChange?: (routeName: string) => void;
};

export default function NavBar({ onRouteChange }: NavBarProps) {
  // 변수명 camelCase로 통일 (setSelectedRouteName)
  const [selectedRouteName, setSelectedRouteName] = useState<string>("30");
  const routeMap = useRouteMap();
  const routes = routeMap ? Object.keys(routeMap) : [];

  // 컴포넌트 마운트 시와 선택값 변경 시 부모 콜백 호출
  useEffect(() => {
    if (onRouteChange) {
      onRouteChange(selectedRouteName);
    }
  }, [onRouteChange, selectedRouteName]);

  return (
    <nav className="sticky top-0 left-0 w-full h-14 bg-[#003876] shadow-md z-70 flex items-center justify-between px-6">
      <h1 className="text-xl font-extrabold tracking-wide text-white drop-shadow-sm">
        YMCCB
      </h1>
      <div className="flex items-center space-x-3">
        <select
          className="px-3 py-1 rounded text-sm text-[#003876] bg-white shadow-sm"
          value={selectedRouteName}
          onChange={(e) => {
            // 상태 업데이트만 수행합니다.
            setSelectedRouteName(e.target.value);
          }}
        >
          {routes.map((route) => (
            <option key={route} value={route}>
              {route}번
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}
