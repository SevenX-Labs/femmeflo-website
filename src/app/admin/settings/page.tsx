"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide password toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Real-time password validations
  const isLengthValid = newPassword.length >= 12;
  const isByteLengthValid = new TextEncoder().encode(newPassword).length <= 72;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.trim().length > 0 &&
    isLengthValid &&
    isByteLengthValid &&
    isMatchValid &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentPassword) {
      setErrorMessage("Current password is required.");
      return;
    }

    if (!isLengthValid) {
      setErrorMessage("New password must be at least 12 characters long.");
      return;
    }

    if (!isByteLengthValid) {
      setErrorMessage("New password must not exceed 72 bytes.");
      return;
    }

    if (!isMatchValid) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Endpoint: PATCH /api/v1/auth/password
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccessMessage(
        "Password changed successfully. All active sessions have been revoked. Redirecting to login..."
      );

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Backend revokes all tokens. Clear auth state and redirect after 1.8 seconds
      setTimeout(() => {
        logout();
        router.push("/admin/auth/login?changed=true");
      }, 1800);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setErrorMessage(err.message || "Current password is incorrect.");
        } else if (err.statusCode === 429) {
          setErrorMessage(
            err.message || "Too many authentication attempts. Try again later."
          );
        } else {
          setErrorMessage(err.message || "Failed to change password. Please check requirements.");
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName={user?.name || "Super Admin"}
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Security & Preferences"
        title="Admin Settings"
        description="Manage your Super Admin credentials, password policy, and active session security."
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Account Summary & Policy */}
        <div className="space-y-6 lg:col-span-1">
          <SectionCard
            title="Admin Profile"
            description="Active session details"
          >
            <div className="flex items-center gap-3.5 border-b border-rose-50 pb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-[#E61C5D]">
                <User className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-playfair text-lg font-bold text-zinc-900">
                  {user?.name || "Super Admin"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {user?.email || "admin@femmeflo.in"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Role Authority</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-[#156035]">
                  {user?.role || "SUPER_ADMIN"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Account Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active & Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Session Expiration</span>
                <span className="font-semibold text-zinc-700">60 Minutes</span>
              </div>
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#E61C5D]" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                  Security Protocol
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
                  Changing your password immediately invalidates all active session tokens on the backend. You will be redirected to the sign-in screen to authenticate with your new credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Change Password Form */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Change Password"
            description="Update your credentials. Minimum 12 characters required."
          >
            {/* Success Banner */}
            {successMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-xs">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="text-xs">
                  <p className="font-bold">Password Updated Successfully</p>
                  <p className="mt-0.5 leading-relaxed">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-xs">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#E61C5D]" />
                <div className="text-xs">
                  <p className="font-bold">Password Change Failed</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Current Password */}
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
                      setErrorMessage("");
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

              {/* New Password */}
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
                      setErrorMessage("");
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

                {/* Password Requirements Checklist */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                        isLengthValid
                          ? "bg-emerald-100 text-[#156035]"
                          : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {isLengthValid ? <Check className="h-3 w-3 stroke-[3]" /> : "•"}
                    </span>
                    <span className={isLengthValid ? "font-semibold text-emerald-800" : "text-zinc-500"}>
                      At least 12 characters ({newPassword.length}/12)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                        isByteLengthValid
                          ? "bg-emerald-100 text-[#156035]"
                          : "bg-rose-100 text-[#E61C5D]"
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

              {/* Confirm New Password */}
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
                      setErrorMessage("");
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

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:-translate-y-0.5 hover:bg-[#c91550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password & Re-authenticate"
                  )}
                </button>
                <p className="mt-3 text-center text-[11px] text-zinc-400">
                  Connected to endpoint <code className="rounded bg-rose-50 px-1 py-0.5 font-mono text-[#E61C5D]">PATCH /api/v1/auth/password</code>
                </p>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}
