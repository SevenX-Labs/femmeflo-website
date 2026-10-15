"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

export default function AdminAddManagerPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Thane");
  const [village, setVillage] = useState("");
  const [permissions, setPermissions] = useState<string[]>([
    "SELLER_READ",
    "SELLER_CREATE",
    "CUSTOMER_READ",
    "CUSTOMER_CREATE",
    "view_inventory",
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await adminApi.createManager({
        name,
        phone: phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`,
        email: email || undefined,
        password,
        state,
        district,
        village: village || undefined,
        permissions,
      });
      setSaved(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isNetworkError || err.statusCode === 503) {
          setError(err instanceof Error ? err.message : "Unable to create manager.");
        } else {
          setError(err.message || "Failed to create manager record.");
        }
      } else {
        setError("Failed to create manager. Please review the details and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <Link href="/admin/managers" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-[#E61C5D]">
        <ArrowLeft className="h-4 w-4" />Back to managers
      </Link>
      <div className="mt-7">
        <PageHeading
          eyebrow="Manager onboarding"
          title="Add manager"
          description="Create a manager account, assign supervisory territory scope, and configure initial role permissions."
        />
      </div>

      <SectionCard title="Manager credentials & territory" description="Add and provision regional depot manager accounts" className="mt-8">
        <form className="max-w-2xl space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#B4234D]">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-bold text-zinc-700">
              Manager name *
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="Kavita Sharma"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              Contact number *
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="+919876542108"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-bold text-zinc-700">
              Login email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="manager@femmeflo.com"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              Initial password *
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="At least 12 characters"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-xs font-bold text-zinc-700">
              State *
              <input
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                placeholder="Maharashtra"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              District *
              <input
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                placeholder="Thane"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              Town / headquarters
              <input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                placeholder="Thane City"
              />
            </label>
          </div>

          <div>
            <span className="block text-xs font-bold text-zinc-700 mb-2">Initial operational permissions</span>
            <div className="grid gap-2 sm:grid-cols-2 rounded-xl border border-rose-100 bg-[#FFF8FA] p-3">
              {[
                ["SELLER_READ", "View assigned sellers"],
                ["SELLER_CREATE", "Onboard new sellers"],
                ["CUSTOMER_READ", "View customer directory"],
                ["CUSTOMER_CREATE", "Onboard new customers"],
                ["view_inventory", "Monitor territory stock"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes(key)}
                    onChange={() => togglePermission(key)}
                    className="rounded accent-[#E61C5D]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {saved ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-[#157347]">
                ✓ Manager account successfully created in database!
              </div>
              <Link
                href="/admin/managers"
                className="inline-block rounded-xl bg-[#156035] px-5 py-3 text-xs font-bold text-white hover:bg-[#0f4e2b]"
              >
                Return to Managers Directory
              </Link>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating manager...
                </>
              ) : (
                "Save manager"
              )}
            </button>
          )}
        </form>
      </SectionCard>
    </DashboardShell>
  );
}
