"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "@/lib/api/auth";
import { tokenStorage, ApiError } from "@/lib/api/client";
import { clearAllSessionCaches } from "@/lib/api/sessionCaches";
import type { LoginPayload, PublicUser, Role } from "@/lib/api/types";

function getErrorStatus(err: unknown): number | undefined {
  if (err instanceof ApiError) return err.status ?? err.statusCode;
  if (typeof err === "object" && err !== null) {
    const rec = err as Record<string, unknown>;
    if (typeof rec["status"] === "number") return rec["status"];
    if (typeof rec["statusCode"] === "number") return rec["statusCode"];
  }
  return undefined;
}

export interface AuthContextType {
  user: PublicUser | null;
  token: string | null;
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  isBackendOnline: boolean | null;
  login: (payload: LoginPayload, role?: "admin" | "manager" | "seller") => Promise<PublicUser>;
  logout: () => void;
  refreshUser: () => Promise<PublicUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Initialize session and perform background verification
  useEffect(() => {
    let isMounted = true;

    // Non-blocking health check
    authApi
      .health()
      .then(() => {
        if (isMounted) setIsBackendOnline(true);
      })
      .catch(() => {
        if (isMounted) setIsBackendOnline(false);
      });

    // Hydrate token and user from local cache
    const storedToken = tokenStorage.getToken();
    const cachedUser = tokenStorage.getCachedUser<PublicUser>();

    if (storedToken && cachedUser) {
      // Instant startup: cached session immediately available
      queueMicrotask(() => {
        if (!isMounted) return;
        setToken(storedToken);
        setUser(cachedUser);
        setIsLoading(false);
      });

      // Verify in background without blocking route rendering
      authApi
        .me()
        .then(({ user: liveUser }) => {
          if (isMounted) {
            setUser(liveUser);
            tokenStorage.setCachedUser(liveUser);
            setIsVerified(true);
          }
        })
        .catch((err: unknown) => {
          const status = getErrorStatus(err);
          if (status === 401 || status === 403) {
            tokenStorage.clearToken();
            clearAllSessionCaches();
            if (isMounted) {
              setToken(null);
              setUser(null);
              setIsVerified(false);
            }
          } else {
            console.warn("authApi.me() background verification deferred (non-auth error):", err);
          }
        });
    } else if (storedToken) {
      // Token exists without cached user: must resolve me() before rendering
      queueMicrotask(() => {
        if (!isMounted) return;
        setToken(storedToken);
        setIsLoading(true);
      });

      const resolveMeWithRetry = (retriesLeft: number, delayMs: number) => {
        authApi
          .me()
          .then(({ user: liveUser }) => {
            if (isMounted) {
              setUser(liveUser);
              tokenStorage.setCachedUser(liveUser);
              setIsVerified(true);
              setIsLoading(false);
            }
          })
          .catch((err: unknown) => {
            const status = getErrorStatus(err);
            if (status === 401 || status === 403) {
              tokenStorage.clearToken();
              clearAllSessionCaches();
              if (isMounted) {
                setToken(null);
                setUser(null);
                setIsVerified(false);
                setIsLoading(false);
              }
              return;
            }

            // Retry up to 2 times on network errors / cold starts / 5xx
            if (retriesLeft > 0 && isMounted) {
              console.warn(
                `authApi.me() failed (status ${status ?? "unknown"}). Retrying in ${delayMs}ms... (${retriesLeft} retries left)`
              );
              setTimeout(() => {
                if (isMounted) {
                  resolveMeWithRetry(retriesLeft - 1, delayMs * 2);
                }
              }, delayMs);
            } else {
              console.warn("authApi.me() resolution failed after retries (non-auth error):", err);
              if (isMounted) {
                setIsLoading(false);
              }
            }
          });
      };

      resolveMeWithRetry(2, 500);
    } else {
      // Unauthenticated visitor
      queueMicrotask(() => {
        if (!isMounted) return;
        setIsLoading(false);
        setIsVerified(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload, role?: "admin" | "manager" | "seller"): Promise<PublicUser> => {
      clearAllSessionCaches();
      setIsLoading(true);
      try {
        const result = await authApi.login(payload, role);
        tokenStorage.setToken(result.token);
        tokenStorage.setCachedUser(result.user);
        setToken(result.token);
        setUser(result.user);
        setIsVerified(true);
        setIsBackendOnline(true);
        return result.user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    tokenStorage.clearToken();
    clearAllSessionCaches();
    setToken(null);
    setUser(null);
    setIsVerified(false);
  }, []);

  const refreshUser = useCallback(async (): Promise<PublicUser | null> => {
    try {
      const { user: liveUser } = await authApi.me();
      setUser(liveUser);
      tokenStorage.setCachedUser(liveUser);
      setIsVerified(true);
      return liveUser;
    } catch {
      return null;
    }
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isLoading,
      isAuthenticated: Boolean(user && token),
      isVerified,
      isBackendOnline,
      login,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, isVerified, isBackendOnline, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
