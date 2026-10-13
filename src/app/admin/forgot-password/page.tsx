"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { authApi } from "@/lib/api/auth";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ login: email.trim() });
      setSent(true);
    } catch {
      // Regardless of whether account exists, show instructions for security
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FAF8F5] font-jakarta text-zinc-800">
      <div className="relative z-20 w-full shrink-0"><Navbar hideNavigation /></div>
      <div className="relative z-10 grid flex-1 place-items-center px-5 py-8">
        <section className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-6 shadow-[0_24px_80px_rgba(104,48,66,0.12)] sm:p-10">
          <Link href="/admin/auth/login" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-[#E61C5D]">
            <ArrowLeft className="h-4 w-4" />Back to Admin login
          </Link>
          <div className="mt-8">
            <span className="inline-flex rounded-xl bg-rose-50 p-3 text-[#E61C5D]">
              <MailCheck className="h-5 w-5" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">Account recovery</p>
            <h1 className="mt-2 font-playfair text-4xl font-bold text-[#156035]">Reset your password</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Enter your admin email address to generate secure recovery instructions.
            </p>
          </div>

          {sent ? (
            <div role="status" className="mt-7 rounded-xl bg-emerald-50 p-4 text-sm font-semibold leading-relaxed text-emerald-800">
              ✓ If this account exists in the Femmeflo directory, password recovery instructions and a secure token have been generated.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">
                  {error}
                </p>
              )}
              <label className="block text-xs font-bold text-zinc-700">
                Admin email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@femmeflo.com"
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E61C5D] text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550] disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send recovery instructions"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
