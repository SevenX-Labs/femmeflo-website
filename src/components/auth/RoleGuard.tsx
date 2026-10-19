"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/api/types";

const roleHome: Record<Role, string> = {
  SUPER_ADMIN: "/admin",
  MANAGER: "/manager",
  SELLER: "/seller",
};

type RoleGuardProps = {
  role: Role;
  loginPath: string;
  children: React.ReactNode;
};

export function RoleGuard({ role, loginPath, children }: RoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isPublicRoute =
    pathname === loginPath ||
    pathname.startsWith(loginPath) ||
    pathname.includes("/auth/") ||
    pathname.includes("/login") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password");

  useEffect(() => {
    if (isLoading) return;
    if (isPublicRoute) {
      if (user && user.role === role && (pathname.includes("/login") || pathname === loginPath)) {
        router.replace(roleHome[role]);
      }
      return;
    }
    if (!user) {
      router.replace(loginPath);
      return;
    }
    const isAuthorized = user.role === role || (role === "SELLER" && Boolean(user.isSeller));
    if (!isAuthorized) {
      router.replace(loginPath);
      return;
    }
  }, [isLoading, isPublicRoute, loginPath, pathname, role, router, user]);

  if (isPublicRoute) return <>{children}</>;
  const isAuthorized = Boolean(user && (user.role === role || (role === "SELLER" && Boolean(user.isSeller))));
  if (isLoading || !isAuthorized) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] text-sm text-zinc-800">Checking account access...</main>;
  }
  return <>{children}</>;
}