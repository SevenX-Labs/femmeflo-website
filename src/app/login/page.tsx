'use client';

import Link from 'next/link';
import { ShieldCheck, UserCheck, ShoppingBag } from 'lucide-react';

export default function GeneralLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-serif">Femmeflo Staff Login</h1>
          <p className="text-sm text-slate-400 mt-1">Select your designated portal to continue</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/admin/auth/login"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-emerald-500/50 transition-all text-slate-200 group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-slate-100">Super Admin Portal</div>
                <div className="text-xs text-slate-400">Headquarters administration & approvals</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400">Enter &rarr;</span>
          </Link>

          <Link
            href="/manager/auth/login"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-amber-500/50 transition-all text-slate-200 group"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-slate-100">Manager Portal</div>
                <div className="text-xs text-slate-400">Territory management & supervised sellers</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-400">Enter &rarr;</span>
          </Link>

          <Link
            href="/seller/auth/login"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-rose-500/50 transition-all text-slate-200 group"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-slate-100">Seller Portal</div>
                <div className="text-xs text-slate-400">Daily sales, inventory & customer log</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-rose-400">Enter &rarr;</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
            &larr; Back to Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}
