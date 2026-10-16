"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPasswordChanged = searchParams.get("changed") === "true";

  const { user, login, logout, isBackendOnline } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"email" | "password" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter your admin email address.");
      setErrorField("email");
      return;
    }
    if (!password) {
      setError("Enter your password to continue.");
      setErrorField("password");
      return;
    }

    setError("");
    setErrorField(null);
    setIsSubmitting(true);

    try {
      const user = await login({ login: email.trim(), password }, "admin");
      if (user.role !== "SUPER_ADMIN") {
        setError(`Access denied: Account role is ${user.role}. Super Admin credentials required.`);
        return;
      }
      router.push("/admin");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid email or password.");
      } else {
        setError("Sign in failed. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FAF8F5] font-jakarta text-zinc-800">
      <div className="pointer-events-none absolute -left-32 top-36 h-80 w-80 rounded-full bg-rose-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-4 sm:px-8 sm:py-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-[0_24px_80px_rgba(104,48,66,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden overflow-hidden bg-[#156035] p-9 text-white lg:flex lg:flex-col lg:justify-between xl:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-35 border-emerald-400/20" />
            <div className="relative">
              <p className="font-playfair text-3xl font-bold">Femmeflo</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200">Operations workspace</p>
            </div>
            <div className="relative max-w-sm">
              <Sparkles className="mb-5 h-8 w-8 text-[#FDE047]" />
              <h1 className="font-playfair text-4xl font-bold leading-[1.08] xl:text-5xl">Keep your network moving.</h1>
              <p className="mt-4 text-sm leading-relaxed text-emerald-100">A calm, clear view of sellers, stock, sales, and the people who make it all happen.</p>
            </div>
            <div className="relative flex items-center justify-between text-xs text-emerald-200">
              <span>Femmeflo Admin · Head Office</span>
              {isBackendOnline !== null && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px]">
                  <span className={`h-2 w-2 rounded-full ${isBackendOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
                  {isBackendOnline ? "Backend Connected" : "Backend unavailable"}
                </span>
              )}
            </div>
          </section>

          <section className="flex flex-col justify-center p-4.5 sm:p-8 lg:p-12">
            <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-lg text-xs font-bold text-zinc-800 transition hover:text-[#E61C5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
              <ArrowLeft className="h-4 w-4" />Back to Femmeflo
            </Link>
            <div className="mt-7">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">Welcome back</p>
                {isBackendOnline && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Live API</span>
                )}
              </div>
              <h2 className="mt-2 font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#156035]">Sign in to admin</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-800">Enter your credentials to access your operations workspace.</p>
            </div>

            <div className="mt-6 max-w-md rounded-2xl border border-rose-100 bg-[#FFFEFD] p-4 shadow-[0_8px_24px_rgba(104,48,66,0.04)] sm:p-5">
              {isPasswordChanged && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold">Password changed successfully.</p>
                    <p className="mt-0.5 text-[11px] text-emerald-800">
                      Please log in with your new password to start a new session.
                    </p>
                  </div>
                </div>
              )}

              {user && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-sm">
                  <div>
                    <p className="font-bold">Active session: {user.name}</p>
                    <p className="mt-0.5 text-[11px] text-amber-700">Currently signed in as {user.role}.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="ml-3 shrink-0 rounded-lg bg-amber-200/80 px-2.5 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-300"
                  >
                    Sign out
                  </button>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-zinc-700">Email address</span>
                  <span className="relative block">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-700" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      suppressHydrationWarning
                      value={email}
                      onChange={event => { setEmail(event.target.value); setError(""); setErrorField(null); }}
                      placeholder="Enter your email address"
                      aria-invalid={errorField === "email"}
                      className="h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-10 pr-3 text-sm outline-none transition aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50/40 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-zinc-700">Password</span>
                  <span className="relative block">
                    <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-700" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      required
                      suppressHydrationWarning
                      value={password}
                      onChange={event => { setPassword(event.target.value); setError(""); setErrorField(null); }}
                      placeholder="Enter your password"
                      aria-invalid={errorField === "password"}
                      className="h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-10 pr-11 text-sm outline-none transition aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50/40 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(value => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-700 transition hover:bg-rose-50 hover:text-[#E61C5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-800">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={event => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 accent-[#E61C5D]"
                    />
                    Remember me
                  </label>
                  <Link href="/admin/forgot-password" className="text-xs font-bold text-[#E61C5D] transition hover:text-[#c91550]">
                    Forgot password?
                  </Link>
                </div>
                {error && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">
                    <p>{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E61C5D] text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:-translate-y-0.5 hover:bg-[#c91550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
