"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock, Mail, KeyRound, Loader2, X, AlertCircle, Eye, EyeOff, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tokenStorage } from "@/lib/api/client";

export function SessionExpiredModal() {
  const pathname = usePathname();
  const router = useRouter();
  const { login, logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Prefill cached user email or phone if available
      const cached = (tokenStorage.getCachedUser() || user) as { email?: string; phone?: string } | null;
      if (!email) {
        if (cached?.email) {
          setEmail(cached.email);
        } else if (cached?.phone) {
          setEmail(cached.phone);
        }
      }
      setError(null);
      setShowPassword(false);
      setIsOpen(true);
    };

    window.addEventListener("femmeflo:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("femmeflo:unauthorized", handleUnauthorized);
    };
  }, [user, email, pathname]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login({ login: email.trim(), password });
      setIsOpen(false);
      setPassword("");
      setShowPassword(false);
      // Reload page to re-fetch protected resources cleanly
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-5 top-5 rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with lock icon */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100/60 border border-rose-200/60 text-[#E61C5D] shadow-xs">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 id="session-expired-title" className="font-playfair text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">
              Session Expired
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">Sign in to continue without losing your place</p>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-[#E61C5D]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700">Email Address or Phone</label>
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
                placeholder="admin@femmeflo.in or phone number"
                required
                className="w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#E61C5D] focus:bg-white focus:ring-2 focus:ring-rose-100"
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
                placeholder="Enter your password"
                required
                autoFocus
                className="w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] py-2.5 pl-10 pr-11 text-sm text-zinc-900 outline-none transition focus:border-[#E61C5D] focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-[#E61C5D] transition cursor-pointer"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E61C5D] py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.22)] transition hover:bg-[#c91550] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In & Resume"
              )}
            </button>
          </div>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out completely instead</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
