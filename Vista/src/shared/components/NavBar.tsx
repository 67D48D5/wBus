// src/shared/components/NavBar.tsx

"use client";

import { useEffect, useState, useMemo } from "react";

import { APP_NAME } from "@core/constants/env";
import { useRouteMap } from "@bus/hooks/useRouteMap";

type NavBarProps = {
  onRouteSelect?: (routeName: string) => void; // 이름 변경
};

export default function NavBar({ onRouteSelect }: NavBarProps) {
  const routeMap = useRouteMap();

  // Cache the route list with useMemo to prevent unnecessary re-renders
  const routes = useMemo(() => Object.keys(routeMap || {}), [routeMap]);

  // Calculate the initial state only once using useMemo
  const initialRouteName = useMemo(() => {
    return routes.length > 0 ? routes[0] : "";
  }, [routes]);

  const [selectedRouteName, setSelectedRouteName] = useState(initialRouteName);

  // Call the callback only once when the initial route is selected
  useEffect(() => {
    if (initialRouteName) {
      onRouteSelect?.(initialRouteName);
    }
  }, [initialRouteName, onRouteSelect]);

  const handleRouteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRouteName = e.target.value;
    setSelectedRouteName(newRouteName);
    onRouteSelect?.(newRouteName);
  };

  return (
    <nav className="sticky top-0 left-0 w-full h-14 bg-[#003876] shadow-md z-70 flex items-center justify-between px-6">
      <h1 className="text-xl font-extrabold tracking-wide text-white drop-shadow-sm">
        {APP_NAME}
      </h1>
      <div className="flex items-center space-x-3">
        {routes.length > 0 && (
          <select
            className="px-3 py-1 rounded-full text-sm font-medium text-[#003876] bg-white shadow-sm transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={selectedRouteName}
            onChange={handleRouteSelect}
            aria-label="노선 선택"
          >
            {routes.map((route) => (
              <option key={route} value={route}>
                {route}번
              </option>
            ))}
          </select>
        )}
      </div>
    </nav>
  );
}
