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
  Briefcase,
  Award,
  CreditCard,
  GraduationCap,
  Package,
  Building2,
  AlertCircle,
  Save,
  RotateCcw,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { ApiError } from "@/lib/api/client";
import type { SellerItem, ManagerItem } from "@/lib/api/types";
import {
  validateMobileNumber,
  validateEmail,
  validateAadharNumber,
} from "@/lib/validation";

export interface SellerDetailModalProps {
  role?: "Super Admin" | "Manager" | "Seller";
  sellerId: string;
  onClose: () => void;
  onSellerUpdated?: (updated: SellerItem) => void;
}

export function SellerDetailModal({
  role = "Super Admin",
  sellerId,
  onClose,
  onSellerUpdated,
}: SellerDetailModalProps) {
  const [seller, setSeller] = useState<SellerItem | null>(null);
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [education, setEducation] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const populateForm = useCallback((data: SellerItem) => {
    setName(data.name || "");
    setDesignation(data.designation || "Field Sales Officer");
    setEmployeeCode(data.employeeCode || "");
    setPhone(data.phone || "");
    setAlternatePhone(data.alternatePhone || "");
    setEmail(data.email || "");
    setAddress(data.address || "");
    setPincode(data.pincode || "");
    setVillage(data.village || "");
    setDistrict(data.district || "");
    setState(data.state || "");
    setAadharNumber(data.aadharNumber || "");
    setDrivingLicense(data.drivingLicense || "");
    setEducation(data.education || "12th Standard / HSC");
    setSelectedManagerId(data.managerId || data.manager?.id || "");
    setIsActive(data.active !== false);
  }, []);

  const loadSellerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let sellerData: SellerItem;
      if (role === "Manager") {
        const res = await managerApi.getSeller(sellerId);
        sellerData = (res?.seller ?? (res as any)?.user) as SellerItem;
      } else {
        const [sRes, mRes] = await Promise.all([
          adminApi.getSeller(sellerId),
          adminApi.listManagers({ pageSize: 100 }).catch(() => ({ managers: [] })),
        ]);
        sellerData = (sRes?.seller ?? (sRes as any)?.user) as SellerItem;
        setManagers(mRes.managers || []);
      }
      if (!sellerData) {
        throw new Error("Officer record was not found or could not be loaded.");
      }
      setSeller(sellerData);
      populateForm(sellerData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load officer details.");
    } finally {
      setIsLoading(false);
    }
  }, [role, sellerId, populateForm]);

  useEffect(() => {
    loadSellerData();
  }, [loadSellerData]);

  const handleCancelEdit = () => {
    if (seller) {
      populateForm(seller);
    }
    setFormError(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaveSuccess(false);

    // 1. Primary Phone Validation
    const phoneVal = validateMobileNumber(phone);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || "Please enter a valid 10-digit primary mobile number.");
      return;
    }

    // 2. Alternate Phone Validation with NO DUPLICATION check
    let altPhoneNormalized: string | undefined = undefined;
    if (alternatePhone && alternatePhone.trim()) {
      const altVal = validateMobileNumber(alternatePhone);
      if (!altVal.isValid) {
        setFormError("Alternate phone: " + (altVal.error || "Please enter a valid 10-digit mobile number."));
        return;
      }
      const p1 = phoneVal.normalized.replace(/\D/g, "").slice(-10);
      const p2 = altVal.normalized.replace(/\D/g, "").slice(-10);
      if (p1 === p2) {
        setFormError("Alternate phone cannot be identical to Primary Phone 1 (no duplication allowed).");
        return;
      }
      altPhoneNormalized = altVal.normalized;
    }

    // 3. Email Validation
    if (email && email.trim()) {
      const emailVal = validateEmail(email);
      if (!emailVal.isValid) {
        setFormError(emailVal.error || "Please enter a valid email address.");
        return;
      }
    }

    // 4. Aadhaar Validation
    let aadharNormalized: string | undefined = undefined;
    if (aadharNumber && aadharNumber.trim()) {
      const aadharVal = validateAadharNumber(aadharNumber);
      if (!aadharVal.isValid) {
        setFormError(aadharVal.error || "Please enter a valid 12-digit Aadhaar number.");
        return;
      }
      aadharNormalized = aadharVal.normalized;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: name.trim(),
        designation: designation.trim() || undefined,
        employeeCode: employeeCode.trim() || undefined,
        phone: phoneVal.normalized,
        alternatePhone: altPhoneNormalized || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        aadharNumber: aadharNormalized || undefined,
        drivingLicense: drivingLicense.trim() || undefined,
        education: education.trim() || undefined,
        active: isActive,
        managerId: role === "Super Admin" && selectedManagerId ? selectedManagerId : undefined,
      };

      let updatedSeller: SellerItem;
      if (role === "Super Admin") {
        const res = await adminApi.updateSeller(sellerId, payload);
        updatedSeller = res.seller;
      } else {
        const res = await managerApi.updateSeller(sellerId, payload);
        updatedSeller = res.seller;
      }

      setSeller(updatedSeller);
      populateForm(updatedSeller);
      setSaveSuccess(true);
      setIsEditing(false);

      if (onSellerUpdated) {
        onSellerUpdated(updatedSeller);
      }

      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message || "Failed to update field officer profile.");
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to update field officer profile.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const territoryStr = [
    seller?.address,
    seller?.village,
    seller?.district,
    seller?.state,
    seller?.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "Territory Field";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-[#156035] via-[#1a7441] to-[#0f4e2b] px-6 py-6 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-xl shadow-inner">
                <Briefcase className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-100 uppercase tracking-wider border border-emerald-400/30">
                    Field Officer
                  </span>
                  {seller?.employeeCode && (
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-300/30">
                      {seller.employeeCode}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      seller?.active
                        ? "bg-emerald-500/30 text-white border border-emerald-400/40"
                        : "bg-zinc-700/60 text-zinc-300 border border-zinc-600"
                    }`}
                  >
                    {seller?.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h2 className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-white">
                  {seller?.name || "Loading Officer..."}
                </h2>
                <p className="text-xs text-emerald-100/90 font-medium">
                  {seller?.designation || "Field Sales Officer"} · {seller?.village || seller?.district || "Territory"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && seller && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95 cursor-pointer border border-white/20"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/90 backdrop-blur-md transition hover:bg-white/20 active:scale-95 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#156035]" />
              <p className="mt-3 text-xs font-semibold text-zinc-500">Loading verified officer record...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
              <AlertCircle className="h-6 w-6 text-[#E61C5D] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#B4234D]">{error}</p>
              <button
                onClick={loadSellerData}
                className="mt-3 text-xs font-bold text-[#E61C5D] underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          ) : isEditing ? (
            /* Edit Mode Form */
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {formError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-[#B4234D]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Official Role */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  1. Official Role &amp; Credentials
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Employee Name *</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-semibold outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Designation *</label>
                    <input
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-semibold outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Employee Code</label>
                    <input
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-xs font-bold uppercase outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Status</label>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`flex-1 rounded-xl py-2 text-xs font-bold border ${
                          isActive
                            ? "bg-emerald-50 border-emerald-300 text-[#156035]"
                            : "bg-[#FAF8F5] border-zinc-200 text-zinc-600"
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`flex-1 rounded-xl py-2 text-xs font-bold border ${
                          !isActive
                            ? "bg-zinc-200 border-zinc-400 text-zinc-800"
                            : "bg-[#FAF8F5] border-zinc-200 text-zinc-600"
                        }`}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>

                  {role === "Super Admin" && managers.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700">Reporting Manager</label>
                      <select
                        value={selectedManagerId}
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none"
                      >
                        <option value="">Unassigned</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.district || "Territory"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Contact Information */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  2. Contact Numbers (No Duplication)
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Phone Number 1 *</label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none focus:border-emerald-600"
                      placeholder="10-digit primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Phone Number 2 (Alternate)</label>
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none focus:border-emerald-600"
                      placeholder="Optional alternate"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Email ID</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none focus:border-emerald-600"
                      placeholder="officer@femmeflo.in"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Documents & Education */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  3. Identification &amp; Education
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Aadhaar Card Number</label>
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
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-xs outline-none focus:border-emerald-600"
                      placeholder="12-digit Aadhaar"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Driving License</label>
                    <input
                      type="text"
                      value={drivingLicense}
                      onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-xs uppercase outline-none focus:border-emerald-600"
                      placeholder="e.g. MH14 20210001234"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Education</label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none"
                    >
                      <option value="10th Standard">10th Standard / Matriculation</option>
                      <option value="12th Standard / HSC">12th Standard / HSC</option>
                      <option value="Graduate (B.A. / B.Com / B.Sc / BBA)">Graduate (B.A. / B.Com / B.Sc / BBA)</option>
                      <option value="Post Graduate / Master'">Post Graduate / Master's</option>
                      <option value="Diploma / ITI">Diploma / ITI</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Complete Address */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  4. Complete Address
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-700">Street / House / Building</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none focus:border-emerald-600"
                      placeholder="Street address, building, landmark"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">PIN Code</label>
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.slice(0, 6))}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none focus:border-emerald-600"
                      placeholder="6-digit PIN"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">Village / Town</label>
                    <input
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">District</label>
                    <input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700">State</label>
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#156035] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition cursor-pointer"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Officer Record</span>
                </button>
              </div>
            </form>
          ) : (
            /* View Mode Profile Display */
            <div className="space-y-6">
              {saveSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-[#156035]">
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Field officer profile updated successfully in the system.</span>
                </div>
              )}

              {/* Quick Metrics Banner */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-center gap-2 text-emerald-800 mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Stock in Hand</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-[#156035]">
                    {seller?.stockLocation?.balance ?? 0} <span className="text-xs font-bold">pkts</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-4">
                  <div className="flex items-center gap-2 text-[#E61C5D] mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Retail Stores</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-[#E61C5D]">
                    {seller?._count?.customers ?? 0} <span className="text-xs font-bold">accounts</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Award className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed Sales</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-blue-900">
                    {seller?._count?.sales ?? 0} <span className="text-xs font-bold">orders</span>
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown Grids */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 1. Official Role & Reporting */}
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-2">
                    <Briefcase className="h-4 w-4 text-[#156035]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Employment &amp; Designation
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Employee Name</span>
                      <span className="font-bold text-zinc-900">{seller?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Designation</span>
                      <span className="font-semibold text-zinc-800">{seller?.designation || "Field Sales Officer"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Employee Code</span>
                      <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {seller?.employeeCode || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Employment Status</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          seller?.active ? "bg-emerald-100 text-[#156035]" : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {seller?.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-200/60">
                      <span className="text-zinc-500">Reporting Manager</span>
                      <span className="font-bold text-[#156035] text-right">
                        {seller?.manager?.name || "Territory Head"}
                        {seller?.manager?.phone && (
                          <span className="block text-[10px] text-zinc-500 font-normal">
                            {seller.manager.phone}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Contact Details */}
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-2">
                    <Phone className="h-4 w-4 text-[#E61C5D]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Contact Numbers
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Phone Number 1 (Primary)</span>
                      <span className="font-bold text-zinc-900">{seller?.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Phone Number 2 (Alternate)</span>
                      <span className="font-bold text-zinc-900">
                        {seller?.alternatePhone || (
                          <span className="text-zinc-400 italic">No alternate provided</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Email ID</span>
                      <span className="font-medium text-zinc-800">{seller?.email || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Identity Documents & Education */}
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Identification &amp; Qualification
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Aadhaar Card Number</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {seller?.aadharNumber
                          ? `${seller.aadharNumber.slice(0, 4)} ${seller.aadharNumber.slice(4, 8)} ${seller.aadharNumber.slice(8, 12)}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Driving License</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {seller?.drivingLicense || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Education</span>
                      <span className="font-semibold text-zinc-800">
                        {seller?.education || "12th Standard / HSC"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Complete Address & Territory */}
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Complete Address &amp; Territory
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {seller?.address && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Address</span>
                        <span className="font-medium text-zinc-900 text-right">{seller.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Village / Locality</span>
                      <span className="font-medium text-zinc-900">{seller?.village || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">District</span>
                      <span className="font-medium text-zinc-900">{seller?.district || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">State</span>
                      <span className="font-medium text-zinc-900">{seller?.state || "—"}</span>
                    </div>
                    {seller?.pincode && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">PIN Code</span>
                        <span className="font-mono font-bold text-zinc-900">{seller.pincode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 bg-[#FAF8F5] px-6 py-4 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-zinc-500">
            Field Officer ID: <span className="font-mono font-semibold">{sellerId}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#156035] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0f4e2b] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
