"use client";

import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api/client";

type RoleLoginScreenProps = {
  role: "Seller" | "Manager";
  subtitle: string;
  dashboardHref: string;
};

export function RoleLoginScreen({ role, subtitle, dashboardHref }: RoleLoginScreenProps) {
  const router = useRouter();
  const { user, login, logout, isBackendOnline } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"identifier" | "password" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const identifier = loginId.trim();

    if (!identifier) {
      setError("Enter your email or phone number.");
      setErrorField("identifier");
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
      const roleTarget = role === "Seller" ? "seller" : "manager";
      const user = await login({ login: identifier, password }, roleTarget);
      
      const expectedRole = role === "Seller" ? "SELLER" : "MANAGER";
      if (user.role !== expectedRole) {
        logout();
        setError(`Access denied: Account role is ${user.role}. This portal requires ${role} role.`);
        return;
      }

      router.push(dashboardHref);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid credentials. Please verify and try again.");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FAF8F5] font-jakarta text-zinc-800">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-rose-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />
      
      <div className="relative z-10 flex w-full flex-1 items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-[0_24px_80px_rgba(104,48,66,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden overflow-hidden bg-[#156035] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-35 border-emerald-400/20" />
            <div className="relative">
              <p className="font-playfair text-3xl font-bold">Femmeflo</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200">{role} workspace</p>
            </div>
            <div className="relative max-w-sm">
              <p className="font-playfair text-5xl font-bold leading-[1.05]">Make every connection count.</p>
              <p className="mt-5 text-sm leading-relaxed text-emerald-100">{subtitle}</p>
            </div>
            <div className="relative flex items-center justify-between text-xs text-emerald-200">
              <span>Femmeflo {role} application</span>
              {isBackendOnline !== null && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px]">
                  <span className={`h-2 w-2 rounded-full ${isBackendOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
                  {isBackendOnline ? "Backend Connected" : "Local / Offline"}
                </span>
              )}
            </div>
          </section>

          <section className="p-7 sm:p-12 lg:p-16">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-[#E61C5D]">
              <ArrowLeft className="h-4 w-4" />Back to Femmeflo
            </Link>
            
            <div className="mt-10 max-w-md">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">{role} access</p>
                {isBackendOnline && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Live API</span>
                )}
              </div>
              <h1 className="mt-2 font-playfair text-4xl font-bold tracking-tight text-[#156035]">Welcome back</h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">Sign in to continue to your {role.toLowerCase()} workspace.</p>
            </div>

            {user && (
              <div className="mt-6 flex max-w-md items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-sm">
                <div>
                  <p className="font-bold">Active session: {user.name}</p>
                  <p className="mt-0.5 text-[11px] text-amber-700">Currently logged in as {user.role}. Sign in below with {role} credentials to switch.</p>
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

            <form className="mt-8 max-w-md space-y-5" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-zinc-700">Email or phone</span>
                <span className="relative block">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    inputMode="email"
                    name="username"
                    autoComplete="username"
                    required
                    value={loginId}
                    onChange={(event) => {
                      setLoginId(event.target.value);
                      setError("");
                      setErrorField(null);
                    }}
                    placeholder={role === "Seller" ? "seller@femmeflo.com or +919876543211" : "manager@femmeflo.com"}
                    aria-invalid={errorField === "identifier"}
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-10 pr-3 text-sm outline-none transition aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50/40 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-zinc-700">Password</span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                      setErrorField(null);
                    }}
                    placeholder="Enter your password"
                    aria-invalid={errorField === "password"}
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-10 pr-11 text-sm outline-none transition aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50/40 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-[#E61C5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 accent-[#E61C5D]"
                  />
                  Remember me
                </label>
                <Link
                  href={role === "Seller" ? "/seller/forgot-password" : "/manager/forgot-password"}
                  className="text-xs font-bold text-[#E61C5D] hover:text-[#c91550]"
                >
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
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E61C5D] text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:opacity-70"
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

            <div className="mt-6 max-w-md rounded-xl bg-[#FFF8FA] p-3 text-center">
              <p className="text-[11px] leading-relaxed text-zinc-500">
                Connected to endpoint <code className="rounded bg-rose-100/70 px-1 py-0.5 font-mono text-[10px] text-[#E61C5D]">POST /api/v1/{role.toLowerCase()}/auth/login</code>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
