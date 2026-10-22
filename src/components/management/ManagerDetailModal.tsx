"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Check,
  Pencil,
  Eye,
  Loader2,
  Users,
  UserCheck,
  UserPlus,
  Package,
  ArrowRightLeft,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Save,
  RotateCcw,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { ManagerItem, SellerItem, UpdateUserPayload } from "@/lib/api/types";
import { validateAadharNumber, validateDrivingLicense, validateMobileNumber } from "@/lib/validation";
import { webNotificationService } from "@/lib/notifications/webNotifications";
import {
  MANAGER_PERMISSIONS,
  PERMISSION_METADATA,
  syncPermissionAliases,
  hasPermission,
} from "@/lib/permissions";

export interface ManagerDetailModalProps {
  managerId: string;
  onClose: () => void;
  onManagerUpdated?: (updated: ManagerItem) => void;
}

const PERMISSION_ICONS: Record<string, React.ReactNode> = {
  onboard_customers: <UserPlus className="h-4 w-4 text-[#E61C5D]" />,
  view_customers: <Users className="h-4 w-4 text-emerald-700" />,
  manage_sellers: <UserCheck className="h-4 w-4 text-blue-600" />,
  view_inventory: <Package className="h-4 w-4 text-amber-600" />,
  transfer_inventory: <ArrowRightLeft className="h-4 w-4 text-purple-600" />,
  approve_sales: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  view_reports: <BarChart3 className="h-4 w-4 text-indigo-600" />,
};

export function ManagerDetailModal({
  managerId,
  onClose,
  onManagerUpdated,
}: ManagerDetailModalProps) {
  const [manager, setManager] = useState<ManagerItem | null>(null);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode toggle
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [active, setActive] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [aadharNumber, setAadharNumber] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [education, setEducation] = useState("Graduate");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Action status
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Load manager details and subordinate field officers
  const loadManagerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mgrRes, sellersRes] = await Promise.all([
        adminApi.getManager(managerId),
        adminApi.listSellers({ managerId, pageSize: 100 }).catch(() => ({ sellers: [] })),
      ]);

      const mgr = mgrRes.manager;
      if (!mgr) {
        throw new Error("Manager profile could not be retrieved.");
      }

      setManager(mgr);
      setSellers(sellersRes.sellers ?? (sellersRes as any).items ?? []);

      // Populate form state
      setName(mgr.name || "");
      setEmployeeCode(mgr.employeeCode || "");
      setPhone(mgr.phone || "");
      setEmail(mgr.email || "");
      setState(mgr.state || "");
      setDistrict(mgr.district || "");
      setVillage(mgr.village || "");
      setActive(mgr.active ?? true);
      setIsSeller(Boolean(mgr.isSeller));
      setAadharNumber(mgr.aadharNumber || "");
      setDrivingLicense(mgr.drivingLicense || "");
      setEducation(mgr.education || "Graduate");
      setAddress(mgr.address || "");
      setPincode(mgr.pincode || "");
      setAlternatePhone(mgr.alternatePhone || "");

      // Determine active manager permissions
      const activePerms = (Array.from(MANAGER_PERMISSIONS) as string[]).filter((p) =>
        hasPermission(mgr as any, p)
      );
      setSelectedPermissions(activePerms);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load manager details from server."
      );
    } finally {
      setIsLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    loadManagerData();
  }, [loadManagerData]);

  // Handle permission toggle
  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const grantAllPermissions = () => {
    setSelectedPermissions(Array.from(MANAGER_PERMISSIONS));
  };

  const revokeAllPermissions = () => {
    setSelectedPermissions([]);
  };

  // Reset form to current manager data
  const handleCancelEdit = () => {
    if (manager) {
      setName(manager.name || "");
      setEmployeeCode(manager.employeeCode || "");
      setPhone(manager.phone || "");
      setEmail(manager.email || "");
      setState(manager.state || "");
      setDistrict(manager.district || "");
      setVillage(manager.village || "");
      setActive(manager.active ?? true);
      setIsSeller(Boolean(manager.isSeller));
      setAadharNumber(manager.aadharNumber || "");
      setDrivingLicense(manager.drivingLicense || "");
      setEducation(manager.education || "Graduate");
      setAddress(manager.address || "");
      setPincode(manager.pincode || "");
      setAlternatePhone(manager.alternatePhone || "");
      const activePerms = (Array.from(MANAGER_PERMISSIONS) as string[]).filter((p) =>
        hasPermission(manager as any, p)
      );
      setSelectedPermissions(activePerms);
    }
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditMode(false);
  };

  // Save changes to backend
  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manager) return;

    // Validate inputs
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError("Manager name is required.");
      return;
    }

    const trimmedPhone = phone.trim().replace(/[\s\-()]/g, "");
    if (!trimmedPhone) {
      setSaveError("Phone number is required.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Validate Aadhaar if provided
      let normalizedAadhar: string | undefined = undefined;
      if (aadharNumber && aadharNumber.trim()) {
        const aadharVal = validateAadharNumber(aadharNumber);
        if (!aadharVal.isValid || !aadharVal.normalized) {
          setSaveError(aadharVal.error || "Please enter a valid 12-digit Aadhaar number.");
          setIsSaving(false);
          return;
        }
        normalizedAadhar = aadharVal.normalized;
      }

      // Validate Driving License if provided
      let normalizedDl: string | undefined = undefined;
      if (drivingLicense && drivingLicense.trim()) {
        const dlVal = validateDrivingLicense(drivingLicense);
        if (!dlVal.isValid || !dlVal.normalized) {
          setSaveError(dlVal.error || "Please enter a valid Indian Driving License number (e.g. MH14 20210001234).");
          setIsSaving(false);
          return;
        }
        normalizedDl = dlVal.normalized;
      }

      // Validate Alternate Phone if provided
      let normalizedAltPhone: string | undefined = undefined;
      if (alternatePhone && alternatePhone.trim()) {
        const altVal = validateMobileNumber(alternatePhone);
        if (!altVal.isValid) {
          setSaveError("Alternate phone: " + (altVal.error || "Please enter a valid 10-digit mobile number."));
          setIsSaving(false);
          return;
        }
        if (trimmedPhone.slice(-10) === altVal.normalized.replace(/\D/g, "").slice(-10)) {
          setSaveError("Alternate phone cannot be the same as primary phone number.");
          setIsSaving(false);
          return;
        }
        normalizedAltPhone = altVal.normalized;
      }

      const payloadPermissions = syncPermissionAliases(selectedPermissions);

      // 1. Update basic details, documents, and territory
      const updatePayload: UpdateUserPayload = {
        name: trimmedName,
        phone: trimmedPhone,
        employeeCode: employeeCode.trim() || undefined,
        active,
        isSeller,
        aadharNumber: normalizedAadhar,
        drivingLicense: normalizedDl,
        education: education.trim() || undefined,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        alternatePhone: normalizedAltPhone,
      };

      if (email.trim()) {
        updatePayload.email = email.trim().toLowerCase();
      }

      if (state.trim()) updatePayload.state = state.trim();
      if (district.trim()) updatePayload.district = district.trim();
      if (village.trim()) updatePayload.village = village.trim();

      // Send manager profile update
      const updateRes = await adminApi.updateManager(manager.id, updatePayload);
      const updatedProfile = updateRes.manager ?? { ...manager, ...updatePayload };

      // 2. Update manager permissions
      await adminApi.updateManagerPermissions(manager.id, payloadPermissions);

      // Create merged updated object
      const fullUpdated: ManagerItem = {
        ...updatedProfile,
        name: trimmedName,
        employeeCode: employeeCode.trim() || null,
        phone: trimmedPhone,
        alternatePhone: normalizedAltPhone || null,
        email: email.trim() ? email.trim().toLowerCase() : null,
        state: state.trim() || null,
        district: district.trim() || null,
        village: village.trim() || null,
        address: address.trim() || null,
        pincode: pincode.trim() || null,
        aadharNumber: normalizedAadhar || null,
        drivingLicense: normalizedDl || null,
        education: education.trim() || null,
        active,
        isSeller,
        permissions: payloadPermissions,
      };

      setManager(fullUpdated);
      setSaveSuccess("Manager profile and operational permissions updated successfully!");

      webNotificationService.addNotification({
        recipientRole: "SUPER_ADMIN",
        title: "Manager Profile Updated",
        message: `Profile and permissions for Manager "${fullUpdated.name}" have been updated.`,
        category: "OFFICERS",
        kind: "OFFICER_UPDATED",
        link: "/admin/managers",
        metadata: {
          managerId: fullUpdated.id,
          name: fullUpdated.name,
        },
      });

      if (onManagerUpdated) {
        onManagerUpdated(fullUpdated);
      }

      // Switch back to view overview after a brief confirmation moment
      setTimeout(() => {
        setIsEditMode(false);
        setSaveSuccess(null);
      }, 1400);
    } catch (err: unknown) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to save manager changes. Please verify the information and try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const territoryDisplay =
    manager
      ? [manager.village, manager.district, manager.state].filter(Boolean).join(", ") ||
        "General Scope"
      : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        data-lenis-prevent
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-[#FAF8F5] px-6 py-4">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E61C5D]">
                Regional Manager
              </span>
              {manager?.employeeCode && (
                <span className="font-mono text-[11px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
                  {manager.employeeCode}
                </span>
              )}
              {manager?.isSeller && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-[#E61C5D]">
                  ★ Field Seller Enabled
                </span>
              )}
              {manager && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    manager.active
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      manager.active ? "bg-emerald-600" : "bg-zinc-400"
                    }`}
                  />
                  {manager.active ? "Active" : "Inactive"}
                </span>
              )}
            </div>
            <h2 className="mt-1 font-playfair text-2xl sm:text-3xl font-bold text-[#156035] truncate">
              {manager?.name || "Manager Details"}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-600 truncate">
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{territoryDisplay}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {manager && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setSaveError(null);
                  setSaveSuccess(null);
                  setIsEditMode(!isEditMode);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
                  isEditMode
                    ? "bg-[#156035] text-white hover:bg-[#0f4e2b]"
                    : "border border-[#E61C5D]/30 bg-rose-50 text-[#E61C5D] hover:bg-rose-100"
                }`}
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Mode</span>
                  </>
                ) : (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Details & Permissions</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#156035]" />
              <p className="mt-3 text-sm font-medium text-zinc-600">
                Loading manager profile and permissions...
              </p>
            </div>
          ) : error || !manager ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-rose-600" />
              <p className="mt-2 text-sm font-semibold text-rose-800">
                {error || "Manager profile not found"}
              </p>
              <button
                type="button"
                onClick={loadManagerData}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 shadow-xs hover:bg-rose-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          ) : isEditMode ? (
            /* ========================================================= */
            /* EDIT MODE: Profile Details + Permissions Modification     */
            /* ========================================================= */
            <form onSubmit={handleSaveChanges} className="space-y-6">
              {saveSuccess && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900 shadow-xs">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* 1. Personal & Contact Information */}
              <div className="rounded-xl border border-zinc-200 bg-[#FCFAF6] p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#156035]" />
                    Manager Profile Details
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                    <span>Account Active</span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-[#156035] focus:ring-[#156035] cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Full Name <span className="text-[#E61C5D]">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sahil Hode"
                        required
                        className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Employee Code <span className="font-normal text-zinc-500">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={employeeCode}
                        onChange={(e) => setEmployeeCode(e.target.value)}
                        placeholder="e.g. MGR-001"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Phone Number <span className="text-[#E61C5D]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        required
                        className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-700 mb-1">
                      Email Address <span className="font-normal text-zinc-500">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. manager@femmeflo.in"
                        className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Role / Same as Seller Toggle */}
              <div className="rounded-xl border-2 border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-pink-50/40 to-amber-50/50 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-[#E61C5D] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Seller Capability
                      </span>
                      <h4 className="text-xs font-bold text-zinc-900">
                        Same as Seller (Manager also acts as Field Seller)
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      Enable this if this manager directly conducts field sales and customer onboarding. They can log in to the <strong>Seller Portal</strong> with the <strong>same ID &amp; password</strong> and will receive their own field stock balance.
                    </p>
                  </div>

                  <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isSeller}
                      onChange={(e) => setIsSeller(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-zinc-300 peer-checked:bg-[#E61C5D] peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-focus:outline-none"></div>
                  </label>
                </div>

                {isSeller && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                    <span className="font-bold text-emerald-600">✓</span>
                    <span>Dual Role Active: Field officer stock location will be maintained for this manager.</span>
                  </div>
                )}
              </div>

              {/* Official Identification & Documents (Aadhaar & Driving License) */}
              <div className="rounded-xl border border-zinc-200 bg-[#FCFAF6] p-4 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5 border-b border-zinc-200/70 pb-2">
                  Official Identification &amp; Documents
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Aadhaar Card Number
                    </label>
                    <input
                      type="text"
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
                      placeholder="XXXX XXXX XXXX"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-mono tracking-wider text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                    />
                    <span className="mt-0.5 block text-[10px] text-zinc-400">12-digit Indian Aadhaar number</span>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Driving License Number
                    </label>
                    <input
                      type="text"
                      value={drivingLicense}
                      onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                      placeholder="e.g. MH14 20210001234"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                    />
                    <span className="mt-0.5 block text-[10px] text-zinc-400">Valid Indian Driving License</span>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Educational Qualification
                    </label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                    >
                      <option value="Graduate">Graduate (B.A. / B.Com / B.Sc / BBA)</option>
                      <option value="Post Graduate">Post Graduate / Master's (MBA / M.Com / etc.)</option>
                      <option value="Graduate (Technical)">Graduate (Engineering / Technical)</option>
                      <option value="Diploma">Diploma / Polytechnic</option>
                      <option value="12th Standard / HSC">12th Standard / HSC</option>
                      <option value="Other">Other Qualification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Alternate Phone Number <span className="font-normal text-zinc-500">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      placeholder="Second mobile number"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-700 mb-1">
                        Residential / Office Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Plot / Street / Building address"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit PIN"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Assigned Territory Jurisdiction */}
              <div className="rounded-xl border border-zinc-200 bg-[#FCFAF6] p-4 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5 border-b border-zinc-200/70 pb-2">
                  <MapPin className="h-4 w-4 text-[#156035]" />
                  Assigned Territory Scope
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Thane"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Town / Village</label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Thane West"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Operational Permissions Modification */}
              <div className="rounded-xl border border-zinc-200 bg-[#FCFAF6] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/70 pb-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#156035]" />
                      Modify Operational Permissions
                    </span>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      Enable or disable capabilities for this regional manager.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={grantAllPermissions}
                      className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                    >
                      Grant All
                    </button>
                    <button
                      type="button"
                      onClick={revokeAllPermissions}
                      className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600 border border-zinc-200 hover:bg-zinc-200 transition"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {(Array.from(MANAGER_PERMISSIONS) as string[]).map((permKey) => {
                    const isChecked = selectedPermissions.includes(permKey);
                    const meta = PERMISSION_METADATA[permKey] || {
                      label: permKey,
                      description: "Manager operational permission",
                    };
                    const icon = PERMISSION_ICONS[permKey] || (
                      <ShieldCheck className="h-4 w-4 text-[#156035]" />
                    );

                    return (
                      <div
                        key={permKey}
                        onClick={() => togglePermission(permKey)}
                        className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                          isChecked
                            ? "bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-200/60"
                            : "bg-white/70 border-zinc-200 hover:border-zinc-300 opacity-80"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                              isChecked ? "bg-emerald-50" : "bg-zinc-100"
                            }`}
                          >
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  isChecked ? "text-zinc-900" : "text-zinc-600"
                                }`}
                              >
                                {meta.label}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                                  isChecked
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-zinc-100 text-zinc-500"
                                }`}
                              >
                                {isChecked ? "Enabled" : "Off"}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-zinc-500 leading-snug">
                              {meta.description}
                            </p>
                          </div>
                        </div>

                        {/* Toggle switch visual */}
                        <div className="shrink-0 mt-0.5">
                          <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              isChecked ? "bg-[#156035]" : "bg-zinc-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                isChecked ? "translate-x-4.5" : "translate-x-1"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================= */
            /* VIEW OVERVIEW MODE                                        */
            /* ========================================================= */
            <div className="space-y-5">
              {/* Profile Details Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-200 bg-[#FCFAF6] p-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                    Contact Information
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Employee Code:</span>
                      <strong className="text-zinc-900 font-mono">
                        {manager.employeeCode || "—"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        Phone:
                      </span>
                      <strong className="text-zinc-900 font-mono">
                        {manager.phone || "—"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-zinc-400" />
                        Email:
                      </span>
                      <strong className="text-zinc-900 truncate max-w-[180px]">
                        {manager.email || "—"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Status:</span>
                      <strong
                        className={`font-semibold ${
                          manager.active ? "text-emerald-700" : "text-zinc-500"
                        }`}
                      >
                        {manager.active ? "Active" : "Inactive"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-[#FCFAF6] p-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                    Territory Scope
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">State:</span>
                      <strong className="text-zinc-900">{manager.state || "—"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">District:</span>
                      <strong className="text-zinc-900">{manager.district || "—"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Town / Village:</span>
                      <strong className="text-zinc-900">{manager.village || "—"}</strong>
                    </div>
                  </div>
                </div>
              </div>

                {/* Documents & Official Identification Card */}
                <div className="rounded-xl border border-zinc-200 bg-[#FCFAF6] p-3.5 sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Official Identification &amp; Role Mode
                    </span>
                    {manager.isSeller ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-[#E61C5D] border border-rose-200">
                        Dual Role: Manager &amp; Field Seller
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-600">
                        Manager Only
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Aadhaar Card:</span>
                      <strong className="text-zinc-900 font-mono">
                        {manager.aadharNumber || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Driving License:</span>
                      <strong className="text-zinc-900 font-mono">
                        {manager.drivingLicense || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Qualification:</span>
                      <strong className="text-zinc-900">
                        {manager.education || "—"}
                      </strong>
                    </div>
                    {manager.address && (
                      <div className="sm:col-span-2">
                        <span className="text-zinc-500 block text-[11px]">Address:</span>
                        <strong className="text-zinc-900">
                          {[manager.address, manager.pincode].filter(Boolean).join(" - ")}
                        </strong>
                      </div>
                    )}
                    {manager.alternatePhone && (
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Alternate Phone:</span>
                        <strong className="text-zinc-900 font-mono">
                          {manager.alternatePhone}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

              {/* Field Officers Supervision Card */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#156035]" />
                    Supervised Field Officers
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    {sellers.length} Officer{sellers.length === 1 ? "" : "s"} Assigned
                  </span>
                </div>

                {sellers.length > 0 ? (
                  <div className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-100">
                    {sellers.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 text-xs hover:bg-zinc-50"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-zinc-900 truncate">{s.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {[s.village, s.district].filter(Boolean).join(", ") || "Territory"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-zinc-700">{s.phone || "—"}</p>
                          <span
                            className={`inline-block rounded-full px-2 py-0.2 text-[10px] font-bold ${
                              s.active
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {s.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">
                    No field sales officers currently assigned to this manager scope.
                  </p>
                )}
              </div>

              {/* Operational Capabilities & Access Rights */}
              <div className="rounded-xl border border-zinc-200 bg-[#FAF8F5] p-4">
                <div className="flex items-center justify-between mb-3 border-b border-zinc-200/70 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#156035]" />
                    Operational Capabilities & Access Rights
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="text-xs font-bold text-[#E61C5D] hover:underline flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    Modify
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Array.from(MANAGER_PERMISSIONS) as string[]).map((permKey) => {
                    const isGranted = hasPermission(manager as any, permKey);
                    const meta = PERMISSION_METADATA[permKey] || {
                      label: permKey,
                      description: "Operational capability",
                    };
                    const icon = PERMISSION_ICONS[permKey] || (
                      <ShieldCheck className="h-4 w-4 text-[#156035]" />
                    );

                    return (
                      <div
                        key={permKey}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                          isGranted
                            ? "bg-white border-emerald-200 shadow-xs"
                            : "bg-zinc-50/60 border-zinc-200 opacity-60"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${
                            isGranted ? "bg-emerald-50" : "bg-zinc-100"
                          }`}
                        >
                          {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-zinc-900 truncate">
                              {meta.label}
                            </span>
                            {isGranted ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-800 shrink-0">
                                <Check className="h-2.5 w-2.5" />
                                Granted
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.2 text-[10px] font-semibold text-zinc-500 shrink-0">
                                Restricted
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-1">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions in View Mode */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#156035] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Profile & Permissions</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
