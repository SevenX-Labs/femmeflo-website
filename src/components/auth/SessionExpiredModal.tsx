"use client";

import React, { useState, useEffect } from "react";
import { Lock, Mail, KeyRound, Loader2, X, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tokenStorage } from "@/lib/api/client";

export function SessionExpiredModal() {
  const { login, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      // Prefill cached user email if available
      const cached = (tokenStorage.getCachedUser() || user) as { email?: string } | null;
      if (cached?.email && !email) {
        setEmail(cached.email);
      }
      setError(null);
      setIsOpen(true);
    };

    window.addEventListener("femmeflo:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("femmeflo:unauthorized", handleUnauthorized);
    };
  }, [user, email]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login({ login: email.trim(), password });
      setIsOpen(false);
      setPassword("");
      // Optionally reload the page or let state refresh to retry failed queries seamlessly
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-5 top-5 rounded-xl p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-zinc-700 transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#E61C5D]">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-playfair text-xl font-bold text-zinc-900">Session Expired</h3>
            <p className="text-xs text-zinc-500">Sign in to continue without losing your place</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-[#E61C5D]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@femmeflo.in"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#E61C5D] focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700">Password</label>
            <div className="relative mt-1">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#E61C5D] focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E61C5D] py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.22)] transition hover:bg-[#c91550] active:scale-[0.98] disabled:opacity-50"
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
        </form>
      </div>
    </div>
  );
}
