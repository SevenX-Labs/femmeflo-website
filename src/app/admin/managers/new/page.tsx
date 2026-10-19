"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { syncPermissionAliases } from "@/lib/permissions";
import { validateMobileNumber, validateEmail, validateAadharNumber, validateDrivingLicense } from "@/lib/validation";

export default function AdminAddManagerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Thane");
  const [village, setVillage] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  const [aadharNumber, setAadharNumber] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [education, setEducation] = useState("Graduate");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
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

    const phoneVal = validateMobileNumber(phone);
    if (!phoneVal.isValid) {
      setError(phoneVal.error || "Please enter a valid 10-digit mobile number.");
      return;
    }

    if (email) {
      const emailVal = validateEmail(email);
      if (!emailVal.isValid) {
        setError(emailVal.error || "Please enter a valid email address.");
        return;
      }
    }

    // Aadhaar validation (Mandatory)
    if (!aadharNumber || !aadharNumber.trim()) {
      setError("Aadhaar Card number is mandatory for manager onboarding. Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    const aadharVal = validateAadharNumber(aadharNumber);
    if (!aadharVal.isValid || !aadharVal.normalized) {
      setError(aadharVal.error || "Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    // Driving License validation (Mandatory)
    if (!drivingLicense || !drivingLicense.trim()) {
      setError("Driving License number is mandatory for manager onboarding. Please enter a valid Driving License.");
      return;
    }
    const dlVal = validateDrivingLicense(drivingLicense);
    if (!dlVal.isValid || !dlVal.normalized) {
      setError(dlVal.error || "Please enter a valid Indian Driving License number (e.g. MH14 20210001234).");
      return;
    }

    // Alternate phone check
    let altPhoneNormalized: string | undefined = undefined;
    if (alternatePhone && alternatePhone.trim()) {
      const altVal = validateMobileNumber(alternatePhone);
      if (!altVal.isValid) {
        setError("Alternate phone: " + (altVal.error || "Please enter a valid 10-digit mobile number."));
        return;
      }
      if (phoneVal.normalized.replace(/\D/g, "").slice(-10) === altVal.normalized.replace(/\D/g, "").slice(-10)) {
        setError("Alternate phone cannot be the same as primary contact number.");
        return;
      }
      altPhoneNormalized = altVal.normalized;
    }

    setIsSubmitting(true);

    try {
      await adminApi.createManager({
        name,
        employeeCode: employeeCode.trim() || undefined,
        phone: phoneVal.normalized,
        alternatePhone: altPhoneNormalized,
        email: email || undefined,
        password,
        state,
        district,
        village: village || undefined,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        aadharNumber: aadharVal.normalized,
        drivingLicense: dlVal.normalized,
        education: education.trim() || undefined,
        permissions: syncPermissionAliases(permissions),
        isSeller,
      });
      setSaved(true);
      setTimeout(() => {
        router.push("/admin/managers");
      }, 700);
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
      <Link href="/admin/managers" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-[#E61C5D]">
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

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-xs font-bold text-zinc-700">
              Manager name *
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="Enter full name"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              Employee code
              <input
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="e.g. MGR-001"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              Contact number *
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="Enter 10-digit mobile number"
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
                placeholder="Enter manager email address"
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

          {/* Mandatory Identification Documents */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                Official Verification &amp; Documents
                <span className="text-xs font-semibold text-[#E61C5D]">(Mandatory)</span>
              </h4>
              <p className="text-xs text-zinc-500">Government identification required for manager supervisory credentials.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-zinc-700">
                Aadhaar Card Number <span className="text-[#E61C5D] font-extrabold">*</span>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={aadharNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                    const parts = [];
                    for (let i = 0; i < raw.length; i += 4) {
                      parts.push(raw.slice(i, i + 4));
                    }
                    setAadharNumber(parts.join(" "));
                  }}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-sm tracking-wider outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="XXXX XXXX XXXX"
                />
                <span className="mt-1 block text-[10px] text-zinc-400">12-digit UIDAI number</span>
              </label>

              <label className="block text-xs font-bold text-zinc-700">
                Driving License Number <span className="text-[#E61C5D] font-extrabold">*</span>
                <input
                  type="text"
                  required
                  value={drivingLicense}
                  onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-sm uppercase tracking-wider outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="e.g. MH14 20210001234"
                />
                <span className="mt-1 block text-[10px] text-zinc-400">Valid Indian Driving License</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-zinc-700">
                Educational Qualification
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
                >
                  <option value="Graduate">Graduate (B.A. / B.Com / B.Sc / BBA)</option>
                  <option value="Post Graduate">Post Graduate / Master's (MBA / M.Com / etc.)</option>
                  <option value="Graduate (Technical)">Graduate (Engineering / Technical)</option>
                  <option value="Diploma">Diploma / Polytechnic</option>
                  <option value="12th Standard / HSC">12th Standard / HSC</option>
                  <option value="Other">Other Qualification</option>
                </select>
              </label>

              <label className="block text-xs font-bold text-zinc-700">
                Alternate contact number (Optional)
                <input
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="Second mobile number"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Residential / Office Address
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    placeholder="Plot / Street / Building address"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  PIN Code
                  <input
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    placeholder="6-digit PIN"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Dual Role / Seller Capability Toggle */}
          <div className="rounded-2xl border-2 border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-pink-50/40 to-amber-50/50 p-5 shadow-sm transition-all hover:border-[#E61C5D]/50">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-[#E61C5D] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Seller Capability
                  </span>
                  <h4 className="text-sm font-bold text-zinc-900">
                    Same as Seller (Manager also acts as Field Seller)
                  </h4>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Enable this if this manager will also directly perform field sales and customer onboarding. They can log in to both the <strong>Manager Portal</strong> and <strong>Seller Portal</strong> with the <strong>same ID &amp; password</strong> and will receive their own field stock balance.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={isSeller}
                  onChange={(e) => setIsSeller(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-7 w-14 rounded-full bg-zinc-300 peer-checked:bg-[#E61C5D] peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[3px] after:h-6 after:w-6 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-focus:outline-none"></div>
              </label>
            </div>

            {isSeller && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <span className="text-base font-bold text-emerald-600">✓</span>
                <span>
                  <strong>Dual Role Active:</strong> A field seller stock location will automatically be assigned to this manager upon creation.
                </span>
              </div>
            )}
          </div>

          <div>
            <span className="block text-xs font-bold text-zinc-700 mb-2">Initial operational permissions</span>
            <div className="grid gap-2 sm:grid-cols-2 rounded-xl border border-rose-100 bg-[#FFF8FA] p-3">
              {[
                ["SELLER_READ", "View assigned field officers"],
                ["SELLER_CREATE", "Onboard new field officers"],
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
                ✓ Manager account successfully created! Redirecting to Managers Directory...
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
