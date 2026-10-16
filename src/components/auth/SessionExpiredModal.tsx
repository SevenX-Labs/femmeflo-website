"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  LogOut,
  X,
  Shield,
  Briefcase,
  UserCheck,
  User,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tokenStorage } from "@/lib/api/client";
import type { PublicUser, Role } from "@/lib/api/types";

type AuthRole = "manager" | "admin" | "seller";

interface RoleMeta {
  title: string;
  badge: string;
  eyebrow: string;
  placeholder: string;
  loginHref: string;
  dashboardHref: string;
  brandColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_CONFIG: Record<AuthRole, RoleMeta> = {
  manager: {
    title: "Regional Manager",
    badge: "Manager Session",
    eyebrow: "Regional Manager Access",
    placeholder: "manager@femmeflo.in or 10-digit mobile",
    loginHref: "/manager/auth/login",
    dashboardHref: "/manager",
    brandColor: "#156035",
    icon: Briefcase,
  },
  admin: {
    title: "Super Admin",
    badge: "Admin Session",
    eyebrow: "Super Admin Access",
    placeholder: "admin@femmeflo.in or phone number",
    loginHref: "/admin/auth/login",
    dashboardHref: "/admin",
    brandColor: "#E61C5D",
    icon: Shield,
  },
  seller: {
    title: "Field Officer",
    badge: "Seller Session",
    eyebrow: "Field Officer Access",
    placeholder: "seller@femmeflo.in or 10-digit mobile",
    loginHref: "/seller/auth/login",
    dashboardHref: "/seller",
    brandColor: "#156035",
    icon: UserCheck,
  },
};

export function SessionExpiredModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { login, logout, user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AuthRole>("manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUser, setLastUser] = useState<PublicUser | null>(null);

  // Helper to detect initial role from URL pathname
  const detectRoleFromPath = (path: string | null): AuthRole => {
    if (!path) return "manager";
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/seller")) return "seller";
    if (path.startsWith("/manager")) return "manager";
    return "manager";
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      // Don't show session expired modal on public landing / auth pages
      const isPublicPath =
        !pathname ||
        pathname === "/" ||
        pathname === "/contact" ||
        pathname.includes("/auth/") ||
        pathname.includes("/login") ||
        pathname.includes("/forgot-password") ||
        pathname.includes("/reset-password");

      if (isPublicPath) {
        return;
      }

      // 1. Detect role from path or previous user
      const initialRole = detectRoleFromPath(pathname);
      const cached = (tokenStorage.getLastUser<PublicUser>() ||
        tokenStorage.getCachedUser<PublicUser>() ||
        user) as PublicUser | null;

      if (cached) {
        setLastUser(cached);
        if (cached.role === "SUPER_ADMIN" && pathname.startsWith("/admin")) {
          setSelectedRole("admin");
        } else if (cached.role === "MANAGER" || pathname.startsWith("/manager")) {
          setSelectedRole("manager");
        } else if (cached.role === "SELLER" || pathname.startsWith("/seller")) {
          setSelectedRole("seller");
        } else {
          setSelectedRole(initialRole);
        }

        // Prefill email or phone
        if (cached.email) {
          setEmail(cached.email);
        } else if (cached.phone) {
          setEmail(cached.phone);
        }
      } else {
        setSelectedRole(initialRole);
      }

      setError(null);
      setShowPassword(false);
      setPassword("");
      setIsOpen(true);
    };

    window.addEventListener("femmeflo:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("femmeflo:unauthorized", handleUnauthorized);
    };
  }, [user, pathname]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const currentRoleMeta = useMemo(() => ROLE_CONFIG[selectedRole], [selectedRole]);
  const RoleIcon = currentRoleMeta.icon;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = email.trim();
    if (!identifier || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call login targeting the selected role
      const loggedInUser = await login({ login: identifier, password }, selectedRole);
      setIsOpen(false);
      setPassword("");
      setShowPassword(false);

      // Verify if the authenticated role has access to current path
      const isManagerPath = pathname.startsWith("/manager");
      const isAdminPath = pathname.startsWith("/admin");
      const isSellerPath = pathname.startsWith("/seller");

      if (isManagerPath && loggedInUser.role === "SELLER") {
        router.push("/seller");
      } else if (isAdminPath && loggedInUser.role !== "SUPER_ADMIN") {
        router.push(loggedInUser.role === "MANAGER" ? "/manager" : "/seller");
      } else if (isSellerPath && loggedInUser.role !== "SELLER") {
        router.push(loggedInUser.role === "MANAGER" ? "/manager" : "/admin");
      } else {
        // Same workspace: reload to refresh all active queries and permissions
        window.location.reload();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : `Invalid credentials for ${currentRoleMeta.title}. Please verify your username and password.`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
    router.push(currentRoleMeta.loginHref);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-7 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-5 top-5 rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-colors ${
              selectedRole === "manager"
                ? "bg-emerald-50 border-emerald-200 text-[#156035]"
                : selectedRole === "admin"
                ? "bg-rose-50 border-rose-200 text-[#E61C5D]"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            <RoleIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 pr-6">
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                selectedRole === "manager"
                  ? "text-[#156035]"
                  : selectedRole === "admin"
                  ? "text-[#E61C5D]"
                  : "text-blue-700"
              }`}
            >
              {currentRoleMeta.eyebrow}
            </span>
            <h3
              id="session-expired-title"
              className="font-playfair text-xl sm:text-2xl font-bold text-zinc-900 leading-tight"
            >
              Session Expired
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 truncate">
              Sign in to resume without losing your place
            </p>
          </div>
        </div>

        {/* 3-Role Workspace Selector Tabs */}
        <div className="mt-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            Select Workspace Role
          </label>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100/90 p-1 text-xs">
            {(["manager", "admin", "seller"] as AuthRole[]).map((r) => {
              const isSelected = selectedRole === r;
              const meta = ROLE_CONFIG[r];
              const TabIcon = meta.icon;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-bold transition cursor-pointer select-none ${
                    isSelected
                      ? "bg-white text-zinc-900 shadow-xs ring-1 ring-black/5"
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{meta.title.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Previous session notice */}
        {lastUser && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-200/80 bg-[#FCFAF6] px-3 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-600 truncate">
                Last user: <strong className="text-zinc-900">{lastUser.name}</strong>{" "}
                <span className="text-[10px] text-zinc-400">({lastUser.role})</span>
              </span>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-800 border border-emerald-200 shrink-0">
              Cached
            </span>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-[#B4234D]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-zinc-700">
              {currentRoleMeta.title} Email or Mobile
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={currentRoleMeta.placeholder}
                required
                className="w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#156035] focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700">Password</label>
            <div className="relative mt-1.5">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter account password"
                required
                autoFocus
                className="w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] py-2.5 pl-10 pr-11 text-sm text-zinc-900 outline-none transition focus:border-[#156035] focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-emerald-50 hover:text-[#156035] transition cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#156035] py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(21,96,53,0.22)] transition hover:bg-[#0f4e2b] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying {currentRoleMeta.title}...</span>
                </>
              ) : (
                `Sign In as ${currentRoleMeta.title} & Resume`
              )}
            </button>
          </div>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out to {currentRoleMeta.title} sign-in screen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
