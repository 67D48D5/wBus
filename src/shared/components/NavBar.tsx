// src/shared/components/NavBar.tsx

"use client";

import { useEffect, useState } from "react";

import { APP_NAME } from "@core/constants/env";

import { useRouteMap } from "@bus/hooks/useRouteMap";

type NavBarProps = {
  onRouteChange?: (routeName: string) => void;
};

export default function NavBar({ onRouteChange }: NavBarProps) {
  const routeMap = useRouteMap();
  const routes = Object.keys(routeMap || {});
  const [selectedRouteName, setSelectedRouteName] = useState<string>(
    () => routes[0] || "30"
  );

  // When the component mounts, if no route is selected, default to "30"
  useEffect(() => {
    onRouteChange?.(selectedRouteName);
  }, [onRouteChange, selectedRouteName]);

  return (
    <nav className="sticky top-0 left-0 w-full h-14 bg-[#003876] shadow-md z-70 flex items-center justify-between px-6">
      <h1 className="text-xl font-extrabold tracking-wide text-white drop-shadow-sm">
        {APP_NAME}
      </h1>
      <div className="flex items-center space-x-3">
        <select
          className="px-3 py-1 rounded text-sm text-[#003876] bg-white shadow-sm"
          value={selectedRouteName}
          onChange={(e) => {
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
