// src/features/bus/utils/formatters.ts

import { UI_TEXT } from "@core/config/locale";

/**
 * Utility functions for formatting data for display
 */

/**
 * Format seconds to minutes, rounding up
 * @param seconds - Time in seconds
 * @returns Time in minutes (rounded up)
 */
export function secondsToMinutes(seconds: number): number {
  return Math.ceil(seconds / 60);
}

/**
 * Format vehicle type string for display
 * @param vehicleType - Full vehicle type string
 * @returns Shortened vehicle type (first 2 characters)
 */
export function formatVehicleType(vehicleType: string): string {
  return vehicleType.slice(0, 2);
}

/**
 * Format route number for display
 * @param routeNo - Route number string
 * @returns Formatted route number with suffix
 */
export function formatRouteNumber(routeNo: string): string {
  return `${routeNo}${UI_TEXT.BUS_LIST.TITLE_ROUTE}`;
}
