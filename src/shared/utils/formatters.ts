// src/shared/utils/formatters.ts

/**
 * Utility functions for formatting data for display
 */

/**
 * Format arrival time in minutes to a human-readable string
 * @param minutes - Time in minutes until arrival
 * @param stopsAway - Number of stops away (optional)
 * @returns Formatted string
 */
export function formatArrivalTime(minutes: number, stopsAway?: number): string {
  const stopsText = stopsAway !== undefined ? ` (${stopsAway} 정류장 전)` : "";
  
  if (minutes <= 3) {
    return `곧 도착${stopsText}`;
  }
  
  return `${minutes}분${stopsText}`;
}

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
 * @returns Formatted route number with "번" suffix
 */
export function formatRouteNumber(routeNo: string): string {
  return `${routeNo}번`;
}
