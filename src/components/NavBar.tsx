// src/components/NavBar.tsx

"use client";

import { useEffect, useState } from "react";

import { useRouteMap } from "@/hooks/useRouteMap";

type NavBarProps = {
  onRouteChange?: (routeName: string) => void;
};

export default function NavBar({ onRouteChange }: NavBarProps) {
  const [selectedRouteName, setselectedRouteName] = useState<string>("30");
  const routeName = useRouteMap();
  const routes = routeName ? Object.keys(routeName) : [];

  useEffect(() => {
    if (onRouteChange) {
      onRouteChange(selectedRouteName);
    }
  }, [onRouteChange, selectedRouteName]);

  return (
    <nav className="fixed top-0 left-0 w-full h-14 bg-[#003876] shadow-md z-50 flex items-center justify-between px-6">
      <h1 className="text-xl font-extrabold tracking-wide text-white drop-shadow-sm">
        YMCCB
      </h1>
      <div className="flex items-center space-x-3">
        <select
          className="px-3 py-1 rounded text-sm text-[#003876] bg-white shadow-sm"
          value={selectedRouteName}
          onChange={(e) => {
            const value = e.target.value;
            setselectedRouteName(value); // 내부 상태 업데이트
            onRouteChange?.(value); // 부모에게 콜백 (있으면)
          }}
        >
          {routes.map((routeName) => (
            <option key={routeName} value={routeName}>
              {routeName}번
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}
