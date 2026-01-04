// src/core/api/fetchAPI.ts

import { API_URL, APP_NAME } from "@core/constants/env";
import { ERROR_MESSAGES } from "@core/constants/locale";

// Set a delay function for retry logic
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Custom Error Class for HTTP Errors
export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * API Fetch Function (GET)
 * @param endpoint ex: `/getBusLocation/34`
 * @param retries Max retries (default: 3)
 * @param retryDelay Retry Interval (ms, default: 1000)
 */
export async function fetchAPI<T = unknown>(
  endpoint: string,
  retries = 3,
  retryDelay = 1000
): Promise<T> {
  if (API_URL === "NOT_SET") {
    throw new Error(ERROR_MESSAGES.API_URL_NOT_SET);
  }

  const url = `${API_URL}${endpoint}`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Client: APP_NAME,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpError(
          ERROR_MESSAGES.HTTP_ERROR(response.status, errorText),
          response.status
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      const isLast = i === retries - 1;

      if (isLast) {
        if (error instanceof HttpError) {
          throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(ERROR_MESSAGES.REQUEST_FAILED(message));
      }

      await delay(retryDelay);
    }
  }

  throw new Error(ERROR_MESSAGES.UNKNOWN_NETWORK_ERROR);
}
