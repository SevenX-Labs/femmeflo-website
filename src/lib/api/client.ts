/**
 * FemmeFlo Production Frontend API Client
 * Built for high-reliability, clean error boundaries, and seamless token management.
 */

import type { ApiResponse } from "./types";

// Determine API Base URL
// Use the configured API URL in every environment, with the deployed API as the fallback.
const rawApiUrl = (
  process.env.NEXT_PUBLIC_API_URL || "https://femmeflo-inventory.onrender.com/api/v1"
).trim().replace(/\/+$/, "");

export const API_BASE_URL = rawApiUrl.endsWith("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl}/api/v1`;


const TOKEN_KEY = "femmeflo_auth_token";
const USER_KEY = "femmeflo_auth_user";

// Token & User Persistence
export const tokenStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignored in restricted environments
    }
  },

  clearToken(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignored
    }
  },

  getCachedUser<T>(): T | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCachedUser<T>(user: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignored
    }
  },
};

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;
  isNetworkError: boolean;

  constructor(message: string, statusCode = 500, data?: unknown, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  timeoutMs?: number;
}

/**
 * Core HTTP Request Wrapper
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    params,
    skipAuth = false,
    timeoutMs = 15000,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  // Build query string
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  // Build headers
  const headers = new Headers(customHeaders as HeadersInit);
  if (!headers.has("Content-Type") && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = tokenStorage.getToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Setup abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body:
        body !== undefined
          ? body instanceof FormData
            ? body
            : JSON.stringify(body)
          : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON
    const contentType = response.headers.get("content-type");
    let responseData: unknown = null;
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => "");
      responseData = { message: text };
    }

    if (!response.ok) {
      const errorData = responseData as { message?: string } | null;
      const message =
        errorData?.message ||
        `Request failed with status ${response.status} (${response.statusText})`;

      if (response.status === 401) {
        // Token expired or invalid
        tokenStorage.clearToken();
      }

      throw new ApiError(message, response.status, responseData);
    }

    // Server returns { success: true, message: ..., data: ... }
    const typed = responseData as ApiResponse<T>;
    if (typed && typeof typed === "object" && "data" in typed) {
      return typed.data;
    }

    return responseData as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please check your network and try again.", 408, null, true);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to connect to Femmeflo server. Check that the backend is running.";

    throw new ApiError(message, 503, null, true);
  }
}

/**
 * Safe API Caller helper for screens to prevent crashing when backend is booting
 */
export async function safeApiCall<T>(
  apiFn: () => Promise<T>,
  fallbackValue: T
): Promise<{ data: T; isFallback: boolean; error: string | null }> {
  try {
    const data = await apiFn();
    return { data, isFallback: false, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to reach server";
    return { data: fallbackValue, isFallback: true, error: message };
  }
}
