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
const LAST_USER_KEY = "femmeflo_last_user";

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
      clearApiCache();
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

  getLastUser<T>(role?: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      if (role) {
        const roleKey = role.toLowerCase().replace("super_", "");
        const roleData = localStorage.getItem(`femmeflo_last_user_${roleKey}`);
        if (roleData) return JSON.parse(roleData);
      }
      const data = localStorage.getItem(LAST_USER_KEY) || localStorage.getItem(USER_KEY);
      const parsed = data ? JSON.parse(data) : null;
      if (role && parsed && (parsed as any).role) {
        const uRole = String((parsed as any).role).toLowerCase().replace("super_", "");
        const targetRole = role.toLowerCase().replace("super_", "");
        if (uRole !== targetRole) {
          return null;
        }
      }
      return parsed;
    } catch {
      return null;
    }
  },

  setCachedUser<T>(user: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(LAST_USER_KEY, JSON.stringify(user));
      if (user && typeof user === "object" && "role" in user && (user as any).role) {
        const roleStr = String((user as any).role).toLowerCase();
        if (roleStr.includes("admin")) {
          localStorage.setItem("femmeflo_last_user_admin", JSON.stringify(user));
        } else if (roleStr.includes("manager")) {
          localStorage.setItem("femmeflo_last_user_manager", JSON.stringify(user));
        } else if (roleStr.includes("seller")) {
          localStorage.setItem("femmeflo_last_user_seller", JSON.stringify(user));
        }
      }
    } catch {
      // Ignored
    }
  },
};

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;
  isNetworkError: boolean;
  isRateLimited: boolean;
  retryAfterSeconds?: number;

  constructor(
    message: string,
    statusCode = 500,
    data?: unknown,
    isNetworkError = false,
    isRateLimited = false,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.isRateLimited = isRateLimited || statusCode === 429;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  timeoutMs?: number;
  skipClientThrottle?: boolean;
  skipCache?: boolean;
  cacheTtlMs?: number;
}

// In-memory GET response cache to provide instant navigation without constant re-fetching
interface ApiCacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

const apiGetCache = new Map<string, ApiCacheEntry>();
const inFlightGetRequests = new Map<string, Promise<unknown>>();

/**
 * Clear client-side API response cache.
 * When endpointSubstr is provided, only matching keys are cleared.
 */
export function clearApiCache(endpointSubstr?: string): void {
  if (!endpointSubstr) {
    apiGetCache.clear();
    return;
  }
  for (const key of Array.from(apiGetCache.keys())) {
    if (key.includes(endpointSubstr)) {
      apiGetCache.delete(key);
    }
  }
}

/**
 * Synchronously peek cached API response data without triggering network request
 */
export function getCachedApiResponse<T = unknown>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): T | null {
  if (typeof window === "undefined") return null;
  const token = tokenStorage.getToken() || "anon";
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") searchParams.append(k, String(v));
    });
    const qs = searchParams.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  const cacheKey = `GET:${url}:${token}`;
  const entry = apiGetCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    apiGetCache.delete(cacheKey);
    return null;
  }
  return entry.data as T;
}

// Client-side mutation deduplication tracker to prevent rapid duplicate clicks
const activeMutations = new Set<string>();
const recentMutationTimestamps = new Map<string, number>();

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
    skipClientThrottle = false,
    skipCache = false,
    cacheTtlMs = 120000,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const method = (fetchOptions.method || "GET").toUpperCase();

  // Client-side rate-limit / debounce on mutating actions (POST, PUT, PATCH, DELETE)
  const isMutation = method !== "GET" && method !== "HEAD";
  const mutationKey = isMutation
    ? `${method}:${endpoint}:${typeof body === "string" ? body : body instanceof FormData ? "formdata" : JSON.stringify(body ?? "")}`
    : "";

  if (isMutation && !skipClientThrottle && mutationKey) {
    const now = Date.now();
    const lastTime = recentMutationTimestamps.get(mutationKey);

    // Prevent immediate double-submission within 600ms
    if (lastTime && now - lastTime < 600) {
      throw new ApiError(
        "Please wait a moment before resubmitting.",
        429,
        null,
        false,
        true,
        1
      );
    }

    // Prevent duplicate in-flight requests
    if (activeMutations.has(mutationKey)) {
      throw new ApiError(
        "A matching request is already in progress. Please wait.",
        429,
        null,
        false,
        true,
        2
      );
    }

    activeMutations.add(mutationKey);
    recentMutationTimestamps.set(mutationKey, now);
  }

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

  const cacheKey = method === "GET" ? `GET:${url}:${skipAuth ? "noauth" : (tokenStorage.getToken() || "anon")}` : "";

  if (method === "GET" && !skipCache && cacheKey) {
    const cached = apiGetCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    const inFlight = inFlightGetRequests.get(cacheKey);
    if (inFlight) {
      return (await inFlight) as T;
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
          ? body instanceof FormData || typeof body === "string"
            ? body
            : JSON.stringify(body)
          : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    const contentType = response.headers.get("content-type");
    let responseData: unknown = null;
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json().catch(() => null);
    } else if (
      contentType &&
      (contentType.includes("application/pdf") ||
        contentType.includes("application/octet-stream") ||
        contentType.includes("image/"))
    ) {
      if (response.ok) {
        return (await response.blob()) as T;
      }
      const text = await response.text().catch(() => "");
      responseData = { message: text };
    } else {
      const text = await response.text().catch(() => "");
      responseData = { message: text };
    }

    if (!response.ok) {
      const errorData = responseData as { message?: string; error?: string } | null;
      let message =
        errorData?.message ||
        errorData?.error ||
        `Request failed with status ${response.status} (${response.statusText})`;

      if (response.status === 401) {
        // Token expired or invalid
        tokenStorage.clearToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("femmeflo:unauthorized", {
              detail: {
                message,
                endpoint,
              },
            })
          );
        }
      }

      if (response.status === 429) {
        const retryHeader = response.headers.get("retry-after") || response.headers.get("Retry-After");
        const retrySec = retryHeader ? parseInt(retryHeader, 10) || 15 : 15;
        if (!errorData?.message && !errorData?.error) {
          message = `Too many requests. Please wait ${retrySec} seconds before trying again.`;
        }
        throw new ApiError(message, 429, responseData, false, true, retrySec);
      }

      throw new ApiError(message, response.status, responseData);
    }

    // Server returns { success: true, message: ..., data: ... }
    const typed = responseData as ApiResponse<T>;
    const finalData = (typed && typeof typed === "object" && "data" in typed ? typed.data : responseData) as T;

    if (method === "GET" && cacheKey) {
      apiGetCache.set(cacheKey, {
        data: finalData,
        timestamp: Date.now(),
        ttl: cacheTtlMs,
      });
    }

    if (isMutation) {
      clearApiCache();
    }

    return finalData;
  } catch (error: unknown) {
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
  } finally {
    clearTimeout(timeoutId);
    if (mutationKey) {
      activeMutations.delete(mutationKey);
    }
    if (cacheKey) {
      inFlightGetRequests.delete(cacheKey);
    }
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
