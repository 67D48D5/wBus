// src/components/NavBar.tsx

"use client";

import { useEffect, useState } from "react";

import { useRouteIds } from "@/hooks/useRouteIds";

type NavBarProps = {
  onRouteChange?: (routeId: string) => void;
};

export default function NavBar({ onRouteChange }: NavBarProps) {
  const [selectedRoute, setSelectedRoute] = useState<string>("30");
  const routeIds = useRouteIds();
  const routes = routeIds ? Object.keys(routeIds) : [];

  useEffect(() => {
    if (onRouteChange) {
      onRouteChange(selectedRoute);
    }
  }, [onRouteChange, selectedRoute]);

  return (
    <nav className="fixed top-0 left-0 w-full h-14 bg-[#003876] shadow-md z-50 flex items-center justify-between px-6">
      <h1 className="text-xl font-extrabold tracking-wide text-white drop-shadow-sm">
        ymccb
      </h1>
      <div className="flex items-center space-x-3">
        <select
          className="px-3 py-1 rounded text-sm text-[#003876] bg-white shadow-sm"
          value={selectedRoute}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedRoute(value); // 내부 상태 업데이트
            onRouteChange?.(value); // 부모에게 콜백 (있으면)
          }}
        >
          {routes.map((routeId) => (
            <option key={routeId} value={routeId}>
              {routeId}번
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}
