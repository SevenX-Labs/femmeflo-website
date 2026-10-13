"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi } from "@/lib/api/auth";
import { tokenStorage } from "@/lib/api/client";
import type { LoginPayload, PublicUser, Role } from "@/lib/api/types";

export interface AuthContextType {
  user: PublicUser | null;
  token: string | null;
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Check health and initialize session from stored token
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      // 1. Health check
      authApi
        .health()
        .then(() => {
          if (isMounted) setIsBackendOnline(true);
        })
        .catch(() => {
          if (isMounted) setIsBackendOnline(false);
        });

      // 2. Hydrate token and user
      const storedToken = tokenStorage.getToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setToken(storedToken);

      try {
        const { user: liveUser } = await authApi.me();
        if (isMounted) {
          setUser(liveUser);
          tokenStorage.setCachedUser(liveUser);
        }
      } catch {
        tokenStorage.clearToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload, role?: "admin" | "manager" | "seller"): Promise<PublicUser> => {
      setIsLoading(true);
      try {
        const result = await authApi.login(payload, role);
      tokenStorage.setToken(result.token);
      tokenStorage.setCachedUser(result.user);
      setToken(result.token);
      setUser(result.user);
      setIsBackendOnline(true);
      return result.user;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<PublicUser | null> => {
    try {
      const { user: liveUser } = await authApi.me();
      setUser(liveUser);
      tokenStorage.setCachedUser(liveUser);
      return liveUser;
    } catch {
      return null;
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    role: user?.role ?? null,
    isLoading,
    isAuthenticated: Boolean(user && token),
    isBackendOnline,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
