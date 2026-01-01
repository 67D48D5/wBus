// src/features/live/utils/errorMessages.ts

import type { BusDataError } from "@live/models/error";
import { ERROR_MESSAGES } from "@core/constants/locale";

/**
 * Map of error codes to user-friendly messages
 */
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  "ERR:NONE_RUNNING": ERROR_MESSAGES.NONE_RUNNING,
  "ERR:NETWORK": ERROR_MESSAGES.NETWORK,
  "ERR:INVALID_ROUTE": ERROR_MESSAGES.INVALID_ROUTE,
};

/**
 * Get a user-friendly error message for a bus data error
 * @param error - The error code
 * @returns A user-friendly error message
 */
export function getBusErrorMessage(error: BusDataError): string {
  if (!error) return "";
  return ERROR_MESSAGE_MAP[error] ?? ERROR_MESSAGES.UNKNOWN;
}

/**
 * Check if an error should show a warning state
 * @param error - The error code
 * @returns True if the error should show a warning
 */
export function isWarningError(error: BusDataError): boolean {
  return error !== null && error !== "ERR:NONE_RUNNING";
}
