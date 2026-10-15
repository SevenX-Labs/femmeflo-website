"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { authApi } from "@/lib/api/auth";

export default function SellerForgotPasswordPage() {
  const [login, setLogin] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ login: login.trim() });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-5 py-12 font-jakarta">
      <section className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-7 shadow-xl sm:p-10">
        <Link href="/seller/auth/login" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-[#E61C5D]">
          <ArrowLeft className="h-4 w-4" />Back to login
        </Link>
        <div className="mt-10">
          <span className="inline-flex rounded-xl bg-rose-50 p-3 text-[#E61C5D]">
            <MailCheck className="h-5 w-5" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">Account recovery</p>
          <h1 className="mt-2 font-playfair text-4xl font-bold text-[#156035]">Reset your password</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            Enter the email or phone number linked to your Seller account.
          </p>
        </div>

        {sent ? (
          <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            ✓ If the account exists, recovery instructions have been dispatched. Check your inbox or SMS messages.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-xs font-bold">
              Email or phone
              <input
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="seller@femmeflo.com or +91..."
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send recovery instructions"}
            </button>
            <p className="text-center text-[11px] text-zinc-400">
              
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
