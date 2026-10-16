"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  Receipt,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Company and Invoice GST Settings states
  const [companyName, setCompanyName] = useState("");
  const [companyGst, setCompanyGst] = useState("");
  const [companyPan, setCompanyPan] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState("");

  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const [companySuccess, setCompanySuccess] = useState("");

  // Load current company invoice settings
  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        setIsLoadingCompany(true);
        const res = await adminApi.getIncentiveSettings();
        if (active && res?.settings) {
          setCompanyName(res.settings.companyName || "");
          setCompanyGst(res.settings.companyGst || "");
          setCompanyPan(res.settings.companyPan || "");
          setCompanyAddress(res.settings.companyAddress || "");
          setCompanyPhone(res.settings.companyPhone || "");
          setCompanyEmail(res.settings.companyEmail || "");
          setInvoiceTerms(res.settings.invoiceTerms || "");
        }
      } catch (err) {
        console.error("Failed to load invoice company settings:", err);
      } finally {
        if (active) setIsLoadingCompany(false);
      }
    }
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  // Save company and tax invoice settings
  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCompanyError("");
    setCompanySuccess("");

    if (!companyName.trim()) {
      setCompanyError("Company Name is required for tax invoices.");
      return;
    }
    if (!companyGst.trim()) {
      setCompanyError("Company GST number is required for tax invoices.");
      return;
    }

    try {
      setIsSubmittingCompany(true);
      await adminApi.updateIncentiveSettings({
        companyName: companyName.trim(),
        companyGst: companyGst.trim().toUpperCase(),
        companyPan: companyPan.trim().toUpperCase(),
        companyAddress: companyAddress.trim(),
        companyPhone: companyPhone.trim(),
        companyEmail: companyEmail.trim(),
        invoiceTerms: invoiceTerms.trim(),
      });
      setCompanySuccess("Company and Tax Invoice details saved successfully. All future generated shopkeeper invoices will embed these details.");
    } catch (err: unknown) {
      setCompanyError(
        err instanceof ApiError ? err.message : "Failed to save company invoice details. Please try again."
      );
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  // Real-time password validations
  const isLengthValid = newPassword.length >= 12;
  const isByteLengthValid = new TextEncoder().encode(newPassword).length <= 72;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmitPassword =
    currentPassword.trim().length > 0 &&
    isLengthValid &&
    isByteLengthValid &&
    isMatchValid &&
    !isSubmittingPassword;

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!isLengthValid) {
      setPasswordError("New password must be at least 12 characters long.");
      return;
    }
    if (!isByteLengthValid) {
      setPasswordError("New password exceeds the 72-byte limit.");
      return;
    }
    if (!isMatchValid) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess("Password updated successfully! Redirecting to login...");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(async () => {
        await logout();
        router.push("/auth/login?changed=true");
      }, 1500);
    } catch (err: unknown) {
      setPasswordError(
        err instanceof ApiError
          ? err.message
          : "Failed to update password. Please verify your current password."
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <DashboardShell
      role="Super Admin"
      workspace="System administration"
      userName={user?.name ?? "Super Admin"}
      userDetail={user?.email ?? "HQ Administrator"}
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Settings"
        title="Account & System Settings"
        description="Manage your enterprise invoice configuration, company GST registration details, and security credentials."
      />

      <div className="mt-8 space-y-8 max-w-4xl">
        {/* Section 1: Company & Invoice GST Details */}
        <SectionCard
          title="Tax Invoice & Company Setup"
          description="Default enterprise data printed on shopkeeper invoices. Once configured, all shopkeeper sales invoices use this company header and GST without fallback."
        >
          {companySuccess && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <span>{companySuccess}</span>
            </div>
          )}

          {companyError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-[#E61C5D]">
              <XCircle className="h-5 w-5 shrink-0 text-[#E61C5D] mt-0.5" />
              <span>{companyError}</span>
            </div>
          )}

          {isLoadingCompany ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#E61C5D]" />
              <span className="ml-2 text-sm">Loading company invoice settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveCompany} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                    Company Legal Name <span className="text-[#E61C5D]">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. FemmeFlo Hygiene Pvt Ltd"
                      required
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-10 pr-4 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                    GSTIN / GST Number <span className="text-[#E61C5D]">*</span>
                  </label>
                  <div className="relative">
                    <Receipt className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={companyGst}
                      onChange={(e) => setCompanyGst(e.target.value.toUpperCase())}
                      placeholder="e.g. 27AABCU9603R1ZM"
                      required
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-10 pr-4 text-sm font-mono uppercase outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                    Company PAN Number
                  </label>
                  <input
                    type="text"
                    value={companyPan}
                    onChange={(e) => setCompanyPan(e.target.value.toUpperCase())}
                    placeholder="e.g. AABCU9603R"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-4 text-sm font-mono uppercase outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                    Company Official Phone
                  </label>
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-4 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                    Company Official Email
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="e.g. billing@femmeflo.com"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-4 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                    Registered Office Address <span className="text-[#E61C5D]">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="e.g. Plot No. 42, MIDC Industrial Area, Pune, Maharashtra - 411001"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                    Invoice Terms & Conditions / Declaration
                  </label>
                  <textarea
                    rows={3}
                    value={invoiceTerms}
                    onChange={(e) => setInvoiceTerms(e.target.value)}
                    placeholder="e.g. Goods once sold will not be taken back. Subject to Pune jurisdiction only."
                    className="w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCompany}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550] disabled:opacity-50"
                >
                  {isSubmittingCompany ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Invoice & Company Setup
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* Section 2: Security & Password */}
        <SectionCard
          title="Account Security"
          description="Update your Super Admin password. A strong password ensures protection of operational inventory and financial data."
        >
          {passwordSuccess && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-[#E61C5D]">
              <XCircle className="h-5 w-5 shrink-0 text-[#E61C5D] mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-700">
                Current Password <span className="text-[#E61C5D]">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter your current password"
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-10 pr-11 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  aria-label={showCurrent ? "Hide current password" : "Show current password"}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-700">
                New Password <span className="text-[#E61C5D]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showNew ? "text" : "password"}
                  name="newPassword"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter at least 12 characters"
                  className={`h-12 w-full rounded-xl border bg-[#FAF8F5] pl-10 pr-11 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-rose-100 ${
                    newPassword.length > 0 && !isLengthValid
                      ? "border-amber-300 focus:border-amber-400"
                      : "border-zinc-200 focus:border-rose-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  aria-label={showNew ? "Hide new password" : "Show new password"}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      isLengthValid ? "bg-emerald-100 text-[#156035]" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {isLengthValid ? <Check className="h-3 w-3 stroke-[3]" /> : "•"}
                  </span>
                  <span className={isLengthValid ? "font-semibold text-emerald-800" : "text-zinc-600"}>
                    At least 12 characters ({newPassword.length}/12)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      isByteLengthValid ? "bg-emerald-100 text-[#156035]" : "bg-rose-100 text-[#E61C5D]"
                    }`}
                  >
                    {isByteLengthValid ? <Check className="h-3 w-3 stroke-[3]" /> : "•"}
                  </span>
                  <span className={isByteLengthValid ? "font-semibold text-emerald-800" : "text-rose-600"}>
                    Max 72 UTF-8 bytes
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-700">
                Confirm New Password <span className="text-[#E61C5D]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Re-enter your new password"
                  className={`h-12 w-full rounded-xl border bg-[#FAF8F5] pl-10 pr-11 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-rose-100 ${
                    confirmPassword.length > 0 && !isMatchValid
                      ? "border-rose-300 focus:border-rose-400"
                      : "border-zinc-200 focus:border-rose-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !isMatchValid && (
                <p className="mt-1.5 text-xs font-medium text-[#E61C5D]">
                  Passwords do not match.
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmitPassword}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:-translate-y-0.5 hover:bg-[#c91550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password & Re-authenticate"
                )}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
