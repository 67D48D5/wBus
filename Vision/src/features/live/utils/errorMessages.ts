// src/features/live/utils/errorMessages.ts

import { UI_TEXT, LOG_MESSAGES } from "@core/config/locale";

import type { BusDataError } from "@core/domain/error";

/**
 * Map of error codes to user-friendly messages
 */
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  "ERR:NONE_RUNNING": UI_TEXT.BUS_LIST.NO_RUNNING,
  "ERR:NETWORK": LOG_MESSAGES.FETCH_FAILED("Bus Data", 500),
  "ERR:INVALID_ROUTE": LOG_MESSAGES.ROUTE_MISSING("Unknown Route"),
};

/**
 * Get a user-friendly error message for a bus data error
 * @param error - The error code
 * @returns A user-friendly error message
 */
export function getBusErrorMessage(error: BusDataError): string {
  if (!error) return "";
  return ERROR_MESSAGE_MAP[error] ?? LOG_MESSAGES.UNHANDLED_EXCEPTION;
}

/**
 * Check if an error should show a warning state
 * @param error - The error code
 * @returns True if the error should show a warning
 */
export function isWarningError(error: BusDataError): boolean {
  return error !== null && error !== "ERR:NONE_RUNNING";
}
