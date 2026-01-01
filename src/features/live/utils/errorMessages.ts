// src/features/live/utils/errorMessages.ts

import type { BusDataError } from "@live/models/error";

/**
 * Map of error codes to user-friendly messages
 */
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  "ERR:NONE_RUNNING": "운행이 종료되었습니다.",
  "ERR:NETWORK": "⚠️ 네트워크 오류가 발생했습니다.",
  "ERR:INVALID_ROUTE": "⚠️ 유효하지 않은 노선입니다.",
};

/**
 * Get a user-friendly error message for a bus data error
 * @param error - The error code
 * @returns A user-friendly error message
 */
export function getBusErrorMessage(error: BusDataError): string {
  if (!error) return "";
  return ERROR_MESSAGE_MAP[error] ?? "⚠️ 알 수 없는 오류가 발생했습니다.";
}

/**
 * Check if an error should show a warning state
 * @param error - The error code
 * @returns True if the error should show a warning
 */
export function isWarningError(error: BusDataError): boolean {
  return error !== null && error !== "ERR:NONE_RUNNING";
}
