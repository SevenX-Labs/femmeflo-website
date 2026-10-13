"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { PublicUser } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

export default function SellerProfilePage() {
  const [profile, setProfile] = useState<(PublicUser & { manager?: { name: string; phone?: string } | null }) | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await sellerApi.getProfile();
        if (res && res.user) {
          setProfile(res.user);
          setName(res.user.name);
          setPhone(res.user.phone || "");
          setEmail(res.user.email || "");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load profile.");
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await sellerApi.updateProfile({
        name,
        phone: phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`,
        email: email || undefined,
      });

      setProfile((prev) => ({ ...prev, ...res.user }));
      setSaved(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to update profile.");
      } else {
        setError("Failed to update profile.");
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaved(false), 4000);
    }
  };

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={profile?.name || "Seller"}
      userDetail={`Seller · ${profile?.village || "Assigned territory"}`}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Account"
        title="My profile"
        description="Review your verified field contact details, supervisor assignment, and regional territory."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <SectionCard title="Seller account" description="Your field jurisdiction">
          <div className="rounded-2xl bg-[#FFF8FA] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#E61C5D]">Seller account ID</p>
            <p className="mt-1 font-mono text-sm font-bold text-zinc-800">{profile ? `${profile.id.slice(0, 8)}...` : "Loading..."}</p>

            <p className="mt-4 text-xs text-zinc-500">Assigned territory</p>
            <p className="mt-1 font-semibold text-zinc-800">
              {[profile?.village, profile?.district, profile?.state].filter(Boolean).join(", ") || "Not available"}
            </p>

            <p className="mt-4 text-xs text-zinc-500">Reporting manager</p>
            <p className="mt-1 font-semibold text-zinc-800">{profile?.manager?.name || "Not available"}</p>

            <p className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {profile?.active ? "Active" : "Unavailable"}
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Contact information" description="Keep your contact and communication credentials current">
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            {error && (
              <p className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">
                {error}
              </p>
            )}

            <label className="text-xs font-bold text-zinc-700">
              Full name *
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
              />
            </label>

            <label className="text-xs font-bold text-zinc-700">
              Phone number *
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
              />
            </label>

            <label className="text-xs font-bold text-zinc-700 sm:col-span-2">
              Login email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
              />
            </label>

            <div className="flex items-center gap-3 sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </button>
              {saved && (
                <span className="text-xs font-semibold text-emerald-700">
                  ✓ Profile updated successfully in backend database.
                </span>
              )}
            </div>
          </form>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
