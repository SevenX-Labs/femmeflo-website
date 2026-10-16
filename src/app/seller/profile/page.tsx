"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  CreditCard,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { PublicUser } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { validateMobileNumber, validateEmail } from "@/lib/validation";

export default function SellerProfilePage() {
  const [profile, setProfile] = useState<
    (PublicUser & { manager?: { name: string; phone?: string; email?: string } | null }) | null
  >(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [education, setEducation] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await sellerApi.getProfile();
        const user = res?.user || (res as any)?.profile;
        if (user) {
          setProfile(user);
          setName(user.name || "");
          setPhone(user.phone || "");
          setAlternatePhone(user.alternatePhone || "");
          setEmail(user.email || "");
          setAddress(user.address || "");
          setPincode(user.pincode || "");
          setDrivingLicense(user.drivingLicense || "");
          setEducation(user.education || "12th Standard / HSC");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load profile.");
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    // Primary Phone validation
    const phoneVal = validateMobileNumber(phone);
    if (!phoneVal.isValid) {
      setError(phoneVal.error || "Please enter a valid 10-digit primary mobile number.");
      return;
    }

    // Alternate Phone validation with NO DUPLICATION check
    let altPhoneNormalized: string | undefined = undefined;
    if (alternatePhone && alternatePhone.trim()) {
      const altVal = validateMobileNumber(alternatePhone);
      if (!altVal.isValid) {
        setError("Alternate phone: " + (altVal.error || "Please enter a valid 10-digit mobile number."));
        return;
      }
      const p1 = phoneVal.normalized.replace(/\D/g, "").slice(-10);
      const p2 = altVal.normalized.replace(/\D/g, "").slice(-10);
      if (p1 === p2) {
        setError("Phone number 2 / alternate phone cannot be identical to Phone number 1.");
        return;
      }
      altPhoneNormalized = altVal.normalized;
    }

    // Email validation
    if (email && email.trim()) {
      const emailVal = validateEmail(email);
      if (!emailVal.isValid) {
        setError(emailVal.error || "Please enter a valid email address.");
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await sellerApi.updateProfile({
        name: name.trim(),
        phone: phoneVal.normalized,
        alternatePhone: altPhoneNormalized || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        drivingLicense: drivingLicense.trim() || undefined,
        education: education.trim() || undefined,
      });

      const updatedUser = res.user || (res as any).profile;
      setProfile((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
      setSaved(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to update profile.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update profile.");
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaved(false), 4000);
    }
  };

  const formattedAadhar = profile?.aadharNumber
    ? `${profile.aadharNumber.slice(0, 4)} ${profile.aadharNumber.slice(4, 8)} ${profile.aadharNumber.slice(8, 12)}`
    : "—";

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={profile?.name || "Field Officer"}
      userDetail={`Field Officer · ${profile?.village || profile?.district || "Assigned territory"}`}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Officer Account"
        title="My profile"
        description="Review your verified field contact credentials, employee classification, and territory jurisdiction."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Left Column: Official Employment Record */}
        <SectionCard title="Employment Record" description="Official company credentials">
          <div className="space-y-4 rounded-2xl bg-[#FFF8FA] p-5 border border-rose-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61C5D]">
                  Designation
                </span>
                <p className="text-base font-black text-zinc-900 mt-0.5">
                  {profile?.designation || "Field Sales Officer"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  profile?.active ? "bg-emerald-100 text-[#156035]" : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {profile?.active ? "Active" : "Inactive"}
              </span>
            </div>

            {profile?.employeeCode && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Employee Code
                </span>
                <p className="font-mono text-xs font-bold text-zinc-900 bg-white border border-rose-100 px-2.5 py-1 rounded-lg mt-1 inline-block">
                  {profile.employeeCode}
                </p>
              </div>
            )}

            <div className="border-t border-rose-100/70 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Reporting Manager
              </span>
              <p className="text-sm font-bold text-zinc-900 mt-0.5">
                {profile?.manager?.name || "Territory Head"}
              </p>
              {profile?.manager?.phone && (
                <p className="text-xs text-zinc-600 mt-0.5">{profile.manager.phone}</p>
              )}
            </div>

            <div className="border-t border-rose-100/70 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Assigned Territory
              </span>
              <p className="text-xs font-semibold text-zinc-800 mt-0.5">
                {[profile?.village, profile?.district, profile?.state].filter(Boolean).join(", ") || "Field Scope"}
              </p>
            </div>

            <div className="border-t border-rose-100/70 pt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Aadhaar Card</span>
                <span className="font-mono font-bold text-zinc-900">{formattedAadhar}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Driving License</span>
                <span className="font-mono font-bold text-zinc-900">
                  {profile?.drivingLicense || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Education</span>
                <span className="font-semibold text-zinc-800">
                  {profile?.education || "12th Standard / HSC"}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Right Column: Editable Contact Information */}
        <SectionCard
          title="Contact & Personal Information"
          description="Keep your contact numbers, address, and profile credentials up to date"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-[#B4234D]">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-zinc-700">
                Employee Full Name *
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
              </label>

              <label className="block text-xs font-bold text-zinc-700">
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="name@femmeflo.in"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-zinc-700">
                Phone Number 1 (Primary) *
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
                <span className="mt-1 block text-[10px] text-zinc-500">
                  Primary number for OTP &amp; login
                </span>
              </label>

              <label className="block text-xs font-bold text-zinc-700">
                Phone Number 2 / Alternate Phone (No duplication)
                <input
                  type="tel"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="Different 10-digit number"
                />
                <span className="mt-1 block text-[10px] text-zinc-500">
                  Must differ from primary phone
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Street / House / Building Address
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    placeholder="House no., Street, Landmark"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  PIN Code
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.slice(0, 6))}
                    className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    placeholder="6-digit PIN"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-zinc-700">
                Driving License Number
                <input
                  type="text"
                  value={drivingLicense}
                  onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-sm uppercase outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="e.g. MH14 20210001234"
                />
              </label>

              <label className="block text-xs font-bold text-zinc-700">
                Educational Qualification
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
                >
                  <option value="10th Standard">10th Standard / Matriculation</option>
                  <option value="12th Standard / HSC">12th Standard / HSC / Intermediate</option>
                  <option value="Graduate (B.A. / B.Com / B.Sc / BBA)">Graduate (B.A. / B.Com / B.Sc / BBA)</option>
                  <option value="Graduate (Technical / Engineering)">Graduate (Technical / Engineering)</option>
                  <option value="Post Graduate / Master'">Post Graduate / Master's</option>
                  <option value="Diploma / ITI Certification">Diploma / ITI Certification</option>
                  <option value="Other">Other Qualification</option>
                </select>
              </label>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-zinc-100">
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="text-xs font-bold text-[#156035] flex items-center gap-1.5">
                    ✓ Profile updated successfully!
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#c91550] disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
