"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Store,
  Trash2,
  Upload,
  Users,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard, type NavigationItem } from "./DashboardShell";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { sellerApi } from "@/lib/api/seller";
import { categoryApi } from "@/lib/api/categories";
import type { Category, CustomerItem, SellerItem } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { webNotificationService } from "@/lib/notifications/webNotifications";

type Props = {
  role: "Super Admin" | "Manager" | "Seller";
  workspace: string;
  userName: string;
  userDetail: string;
  navigation: NavigationItem[];
  backHref: string;
};

interface CustomerBatchRow {
  clientId: string;
  shopName: string;
  contactName: string;
  phone: string;
  categoryId: string;
  pincode: string;
  village: string;
  district: string;
  state: string;
  shopNumber: string;
  streetName: string;
  noPhotoReason: string;
  sellerId: string;
}

function createEmptyRow(defaultCatId = "", defaultState = "Maharashtra", defaultDistrict = "", defaultVillage = "", defaultReason = "Bulk field onboarding visit", defaultSeller = ""): CustomerBatchRow {
  return {
    clientId: Math.random().toString(36).substring(2, 9),
    shopName: "",
    contactName: "",
    phone: "",
    categoryId: defaultCatId,
    pincode: "",
    village: defaultVillage,
    district: defaultDistrict,
    state: defaultState,
    shopNumber: "",
    streetName: "",
    noPhotoReason: defaultReason,
    sellerId: defaultSeller,
  };
}

export function BulkCustomerOnboardingScreen({
  role,
  workspace,
  userName,
  userDetail,
  navigation,
  backHref,
}: Props) {
  const router = useRouter();

  // Categories & Sellers
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Batch Defaults Toolbar
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [defaultState, setDefaultState] = useState("Maharashtra");
  const [defaultDistrict, setDefaultDistrict] = useState("");
  const [defaultVillage, setDefaultVillage] = useState("");
  const [defaultPincode, setDefaultPincode] = useState("");
  const [defaultNoPhotoReason, setDefaultNoPhotoReason] = useState("Bulk field onboarding visit");
  const [defaultSellerId, setDefaultSellerId] = useState("");

  // Pincode lookup state for defaults
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);

  // Table rows
  const [rows, setRows] = useState<CustomerBatchRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  // Excel / CSV Paste Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteData, setPasteData] = useState("");

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const istFormattedDate = currentTime.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const istFormattedTime = currentTime.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Submission & Results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedBatchResult, setSavedBatchResult] = useState<{
    count: number;
    customers: CustomerItem[];
    dateIST: string;
    timeIST: string;
  } | null>(null);

  // Load auxiliary data
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setIsLoadingCategories(true);
        const catRes = await categoryApi.listCategories();
        const list = catRes?.categories ?? (catRes as any)?.items ?? [];
        if (active && list.length > 0) {
          const activeCats = list
            .filter((c: any) => c.active !== false)
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
          setCategories(activeCats);
          if (activeCats.length > 0) {
            setDefaultCategoryId(activeCats[0].id);
            // Apply to existing initial rows
            setRows((prev) =>
              prev.map((r) => ({
                ...r,
                categoryId: r.categoryId || activeCats[0].id,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        if (active) setIsLoadingCategories(false);
      }

      if (role === "Super Admin" || role === "Manager") {
        try {
          const sRes = role === "Super Admin" ? await adminApi.listSellers() : await managerApi.listSellers();
          const sList = sRes?.sellers ?? (sRes as any)?.items ?? [];
          if (active && sList.length > 0) {
            setSellers(sList);
            setDefaultSellerId(sList[0].id);
          }
        } catch (err) {
          console.error("Failed to load sellers:", err);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [role]);

  // Lookup default pincode
  const handleLookupDefaultPincode = async (pin: string) => {
    const cleanPin = pin.trim();
    setDefaultPincode(cleanPin);
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      setIsLookingUpPin(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === "Success") {
            const po = data[0]?.PostOffice?.[0];
            if (po) {
              if (po.District) setDefaultDistrict(po.District);
              if (po.State) setDefaultState(po.State);
              if (po.Name) setDefaultVillage(po.Name);
            }
          }
        }
      } catch (e) {
        console.warn("Pincode lookup error:", e);
      } finally {
        setIsLookingUpPin(false);
      }
    }
  };

  // Lookup pincode for a specific row
  const handleLookupRowPincode = async (index: number, pin: string) => {
    updateRow(index, "pincode", pin);
    const cleanPin = pin.trim();
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === "Success") {
            const po = data[0]?.PostOffice?.[0];
            if (po) {
              setRows((prev) => {
                const next = [...prev];
                const row = next[index];
                if (row) {
                  next[index] = {
                    ...row,
                    district: row.district || po.District || "",
                    state: row.state || po.State || "Maharashtra",
                    village: row.village || po.Name || "",
                  };
                }
                return next;
              });
            }
          }
        }
      } catch (e) {}
    }
  };

  // Row operations
  const updateRow = (index: number, field: keyof CustomerBatchRow, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      createEmptyRow(defaultCategoryId, defaultState, defaultDistrict, defaultVillage, defaultNoPhotoReason, defaultSellerId),
    ]);
  };

  const handleAddMultipleRows = (count: number) => {
    const newRows: CustomerBatchRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(createEmptyRow(defaultCategoryId, defaultState, defaultDistrict, defaultVillage, defaultNoPhotoReason, defaultSellerId));
    }
    setRows((prev) => [...prev, ...newRows]);
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) {
      // Just clear
      setRows([createEmptyRow(defaultCategoryId, defaultState, defaultDistrict, defaultVillage, defaultNoPhotoReason, defaultSellerId)]);
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateRow = (index: number) => {
    const row = rows[index];
    if (!row) return;
    const duplicated: CustomerBatchRow = {
      ...row,
      clientId: Math.random().toString(36).substring(2, 9),
      shopName: `${row.shopName} (Copy)`,
      phone: "", // Reset phone so no accidental duplicate phone error
    };
    setRows((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
  };

  const handleClearEmptyRows = () => {
    const filled = rows.filter((r) => r.shopName.trim() || r.phone.trim() || r.contactName.trim());
    if (filled.length === 0) {
      setRows([createEmptyRow(defaultCategoryId, defaultState, defaultDistrict, defaultVillage, defaultNoPhotoReason, defaultSellerId)]);
    } else {
      setRows(filled);
    }
  };

  // Apply batch defaults to all rows
  const handleApplyDefaultsToAll = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        categoryId: r.categoryId || defaultCategoryId,
        state: r.state || defaultState,
        district: r.district || defaultDistrict,
        village: r.village || defaultVillage,
        pincode: r.pincode || defaultPincode,
        noPhotoReason: r.noPhotoReason || defaultNoPhotoReason,
        sellerId: r.sellerId || defaultSellerId,
      }))
    );
  };

  // Parse CSV or pasted text from Excel
  const handleImportPastedData = () => {
    if (!pasteData.trim()) return;

    const lines = pasteData
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const newRows: CustomerBatchRow[] = [];

    // Check if line 0 is a header
    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes("shop") ||
      firstLineLower.includes("store") ||
      firstLineLower.includes("phone") ||
      firstLineLower.includes("name")
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Split by tab (Excel copy-paste) or comma (CSV)
      const cols = line.includes("\t") ? line.split("\t") : line.split(",");
      const shopName = cols[0]?.trim() || "";
      const contactName = cols[1]?.trim() || shopName;
      const rawPhone = cols[2]?.trim().replace(/\D/g, "") || "";
      const village = cols[3]?.trim() || defaultVillage;
      const district = cols[4]?.trim() || defaultDistrict;
      const pincode = cols[5]?.trim().replace(/\D/g, "").slice(0, 6) || defaultPincode;
      const reason = cols[6]?.trim() || defaultNoPhotoReason;

      if (shopName || rawPhone) {
        newRows.push({
          clientId: Math.random().toString(36).substring(2, 9),
          shopName,
          contactName: contactName || shopName,
          phone: rawPhone,
          categoryId: defaultCategoryId,
          pincode,
          village,
          district,
          state: defaultState,
          shopNumber: "",
          streetName: "",
          noPhotoReason: reason,
          sellerId: defaultSellerId,
        });
      }
    }

    if (newRows.length > 0) {
      // If current table only has empty rows, replace it; else append
      const isCurrentEmpty = rows.every((r) => !r.shopName.trim() && !r.phone.trim());
      setRows(isCurrentEmpty ? newRows : [...rows, ...newRows]);
      setShowImportModal(false);
      setPasteData("");
    }
  };

  // Download sample CSV template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Store / Shop Name,Shopkeeper Name,Mobile Phone (10 Digits),Village / Town,District,PIN Code,Exemption Reason\n" +
      "Sai Krupa General Store,Ramesh Patil,9820123456,Hadapsar,Pune,411028,Bulk field onboarding visit\n" +
      "Mahalaxmi Retailers,Sunita Sharma,9820654321,Shivajinagar,Pune,411005,Bulk field onboarding visit\n" +
      "Om Traders & Mart,Vikram Deshmukh,9890123789,Kothrud,Pune,411038,Bulk field onboarding visit\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "femmeflo_customers_batch_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Validation calculations
  const phoneDuplicates = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const p = r.phone.replace(/\D/g, "");
      if (p.length === 10) {
        counts[p] = (counts[p] || 0) + 1;
      }
    }
    const dups = new Set<string>();
    for (const [p, c] of Object.entries(counts)) {
      if (c > 1) dups.add(p);
    }
    return dups;
  }, [rows]);

  const validatedStats = useMemo(() => {
    let validCount = 0;
    let incompleteCount = 0;

    for (const r of rows) {
      const p = r.phone.replace(/\D/g, "");
      const isPhoneValid = p.length === 10 && !phoneDuplicates.has(p);
      const isShopValid = r.shopName.trim().length > 0;
      const isLocationValid = (r.district.trim() || defaultDistrict) && (r.village.trim() || defaultVillage);
      const isCatValid = Boolean(r.categoryId || defaultCategoryId);

      if (isShopValid && isPhoneValid && isLocationValid && isCatValid) {
        validCount++;
      } else {
        incompleteCount++;
      }
    }

    return { validCount, incompleteCount, totalCount: rows.length };
  }, [rows, phoneDuplicates, defaultDistrict, defaultVillage, defaultCategoryId]);

  // Submit Batch
  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate that we have at least 1 customer
    const filledRows = rows.filter((r) => r.shopName.trim() || r.phone.trim());
    if (filledRows.length === 0) {
      setErrorMessage("Please enter at least one shop name and mobile phone number.");
      return;
    }

    // Check incomplete rows
    for (let i = 0; i < filledRows.length; i++) {
      const r = filledRows[i];
      const p = r.phone.replace(/\D/g, "");
      if (!r.shopName.trim()) {
        setErrorMessage(`Row #${i + 1}: Store / Shop Name is required.`);
        return;
      }
      if (p.length !== 10) {
        setErrorMessage(`Row #${i + 1} (${r.shopName}): Phone must be a valid 10-digit mobile number.`);
        return;
      }
      if (phoneDuplicates.has(p)) {
        setErrorMessage(`Row #${i + 1} (${r.shopName}): Phone number ${p} is duplicated within this batch.`);
        return;
      }
      const dist = r.district.trim() || defaultDistrict.trim();
      const vill = r.village.trim() || defaultVillage.trim();
      if (!dist || !vill) {
        setErrorMessage(`Row #${i + 1} (${r.shopName}): District and Village / Locality are required.`);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmissionProgress(`Preparing ${filledRows.length} customers for atomic upload…`);

    try {
      const nowIso = currentTime.toISOString();

      const payload = {
        defaultCategoryId: defaultCategoryId || undefined,
        defaultSellerId: defaultSellerId || undefined,
        defaultState: defaultState || "Maharashtra",
        defaultDistrict: defaultDistrict || undefined,
        defaultVillage: defaultVillage || undefined,
        defaultNoPhotoReason: defaultNoPhotoReason || "Bulk field onboarding visit",
        customers: filledRows.map((r) => ({
          shopName: r.shopName.trim(),
          contactName: r.contactName.trim() || r.shopName.trim(),
          phone: r.phone.replace(/\D/g, ""),
          categoryId: r.categoryId || defaultCategoryId || undefined,
          sellerId: r.sellerId || defaultSellerId || undefined,
          shopNumber: r.shopNumber.trim() || undefined,
          streetName: r.streetName.trim() || undefined,
          pincode: r.pincode.trim() || defaultPincode || undefined,
          village: r.village.trim() || defaultVillage.trim(),
          district: r.district.trim() || defaultDistrict.trim(),
          state: r.state.trim() || defaultState || "Maharashtra",
          noPhotoReason: r.noPhotoReason.trim() || defaultNoPhotoReason || "Bulk field onboarding visit",
          createdAt: nowIso,
        })),
      };

      setSubmissionProgress(`Saving ${filledRows.length} customers to database in a single batch…`);

      let res: { count: number; customers: CustomerItem[] };
      if (role === "Super Admin") {
        res = await adminApi.createBulkCustomers(payload);
      } else if (role === "Manager") {
        res = await managerApi.createBulkCustomers(payload);
      } else {
        res = await sellerApi.createBulkCustomers(payload);
      }

      webNotificationService.addNotification({
        recipientRole:
          role === "Super Admin" ? "SUPER_ADMIN" : role === "Manager" ? "MANAGER" : "SELLER",
        title: "Multiple Customers Batch Onboarded",
        message: `Successfully registered ${res.count} customer shops at once.`,
        category: "CUSTOMERS",
        kind: "CUSTOMER_ONBOARDED",
        link:
          role === "Super Admin"
            ? "/admin/customers"
            : role === "Manager"
            ? "/manager/customers"
            : "/seller/customers",
      });

      setSavedBatchResult({
        count: res.count,
        customers: res.customers || [],
        dateIST: istFormattedDate,
        timeIST: istFormattedTime,
      });
    } catch (err: unknown) {
      console.error("Bulk customer upload error:", err);
      const msg =
        err instanceof ApiError
          ? err.message
          : (err as any)?.message || "Failed to create customer batch. Please review your fields.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress("");
    }
  };

  return (
    <DashboardShell
      role={role}
      workspace={workspace}
      userName={userName}
      userDetail={userDetail}
      navigation={navigation}
    >
      <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-[#E61C5D]">
        <ArrowLeft className="h-4 w-4" />Back to customers directory
      </Link>

      <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeading
          eyebrow="Bulk Customer Management"
          title="Add Multiple Customers at Once"
          description="Register 1 to N retail customer shops simultaneously in a single batch upload — no one-by-one forms needed."
        />

        {/* Top Switcher: Single vs Batch */}
        <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-xs self-start md:self-auto">
          <Link
            href={role === "Super Admin" ? "/admin/customers/new" : role === "Manager" ? "/manager/customers/new" : "/seller/customers/new"}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition"
          >
            Single Shop Form
          </Link>
          <span className="rounded-lg bg-[#E61C5D] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Batch Entry (1 to N)
          </span>
        </div>
      </div>

      {/* Live Indian Standard Time (IST) Banner */}
      <div className="mt-6 rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-800">
                  Live Indian Standard Time (IST) Batch Stamp
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-700 mt-0.5">
                {istFormattedDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-emerald-200 px-3.5 py-2 shadow-xs shrink-0 sm:self-auto self-start">
            <Calendar className="h-4 w-4 text-emerald-700" />
            <span className="font-mono text-base font-extrabold text-emerald-950 tracking-tight">
              {istFormattedTime}
            </span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              IST
            </span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-emerald-900/80 border-t border-emerald-100/90 pt-2 flex items-center gap-1.5 font-medium">
          <span>⏱️ All shops created in this batch will be recorded with this official Live IST timestamp.</span>
        </p>
      </div>

      {savedBatchResult ? (
        /* SUCCESS CONFIRMATION STATE */
        <div className="mt-8 rounded-2xl border-2 border-emerald-500 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-emerald-950">
                🎉 Successfully Registered &amp; Saved {savedBatchResult.count} Customers at Once!
              </h3>
              <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                All shops have been created in the database and linked to field officers with official Live IST timestamps.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-xl bg-emerald-50/60 border border-emerald-200 p-3.5">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4.5 w-4.5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Saved Date (Live IST)</span>
                    <strong className="text-xs font-bold text-zinc-900">{savedBatchResult.dateIST}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4.5 w-4.5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Saved Time (Live IST)</span>
                    <strong className="text-xs font-bold text-emerald-900 font-mono">{savedBatchResult.timeIST} IST</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Created Customers */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200 text-xs font-bold text-zinc-700 flex items-center justify-between">
              <span>Saved Customer Shops ({savedBatchResult.count})</span>
              <span className="text-[11px] font-normal text-zinc-500">Atomic batch commit verified</span>
            </div>
            <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
              {savedBatchResult.customers.map((c, i) => (
                <div key={c.id || i} className="p-3 text-xs flex flex-wrap items-center justify-between gap-2 hover:bg-zinc-50/80">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
                      {i + 1}
                    </span>
                    <div>
                      <strong className="text-zinc-900 block font-bold">{c.shopName}</strong>
                      <span className="text-[11px] text-zinc-500">{c.contactName} • {c.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-zinc-700 block">
                      {[c.village, c.district].filter(Boolean).join(", ") || c.state}
                    </span>
                    <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-bold">
                      ✓ Active Shop
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => {
                setSavedBatchResult(null);
                setRows([createEmptyRow(defaultCategoryId, defaultState, defaultDistrict, defaultVillage, defaultNoPhotoReason, defaultSellerId)]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Onboard Another Batch</span>
            </button>

            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#156035] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0f4e2b] shadow-xs"
            >
              <span>View Customers Directory</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      ) : (
        /* BATCH ENTRY FORM */
        <form onSubmit={handleSubmitBatch} className="mt-8 space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#B4234D] flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* BATCH DEFAULTS & AUTOFILL TOOLBAR */}
          <div className="rounded-2xl border border-zinc-200/90 bg-[#FAF8F5] p-4.5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200/70 pb-2.5">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#E61C5D] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Shared Batch Defaults (Autofill Helper)
                </span>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Set common values once to auto-populate rows and avoid repetitive typing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyDefaultsToAll}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-rose-200 px-3 py-1.5 text-xs font-bold text-[#E61C5D] hover:bg-rose-50 shadow-2xs transition cursor-pointer"
                  title="Apply these defaults to any empty fields across all rows"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Apply Defaults to All Rows</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Category Default */}
              <label className="block text-xs font-bold text-zinc-700">
                Default Category *
                <select
                  value={defaultCategoryId}
                  onChange={(e) => setDefaultCategoryId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:border-rose-300"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* PIN Code Default with Auto Lookup */}
              <label className="block text-xs font-bold text-zinc-700">
                Default PIN Code (with Lookup)
                <div className="relative mt-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={defaultPincode}
                    onChange={(e) => handleLookupDefaultPincode(e.target.value)}
                    placeholder="e.g. 411028"
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-mono outline-none focus:border-rose-300 pr-8"
                  />
                  {isLookingUpPin && (
                    <div className="absolute right-2.5 top-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    </div>
                  )}
                </div>
              </label>

              {/* District Default */}
              <label className="block text-xs font-bold text-zinc-700">
                Default District *
                <input
                  type="text"
                  value={defaultDistrict}
                  onChange={(e) => setDefaultDistrict(e.target.value)}
                  placeholder="e.g. Pune"
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:border-rose-300"
                />
              </label>

              {/* State Default */}
              <label className="block text-xs font-bold text-zinc-700">
                Default State *
                <input
                  type="text"
                  value={defaultState}
                  onChange={(e) => setDefaultState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:border-rose-300"
                />
              </label>

              {/* Reason Default */}
              <label className="block text-xs font-bold text-zinc-700 sm:col-span-2">
                Photo Exemption Reason *
                <input
                  type="text"
                  value={defaultNoPhotoReason}
                  onChange={(e) => setDefaultNoPhotoReason(e.target.value)}
                  placeholder="e.g. Bulk field onboarding visit"
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:border-rose-300"
                />
              </label>

              {/* Officer Default for Admin & Manager */}
              {(role === "Super Admin" || role === "Manager") && sellers.length > 0 && (
                <label className="block text-xs font-bold text-zinc-700 sm:col-span-2">
                  Assigned Field Officer *
                  <select
                    value={defaultSellerId}
                    onChange={(e) => setDefaultSellerId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:border-rose-300"
                  >
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          {/* TABLE TOOLBAR: QUICK ACTIONS & COUNTERS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-zinc-900 text-white px-3 py-1 text-xs font-extrabold shadow-2xs">
                {rows.length} {rows.length === 1 ? "Shop" : "Shops"} in Batch
              </span>
              <span className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-xs font-bold">
                ✓ {validatedStats.validCount} Ready
              </span>
              {validatedStats.incompleteCount > 0 && (
                <span className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 text-xs font-bold">
                  {validatedStats.incompleteCount} Incomplete
                </span>
              )}
              {phoneDuplicates.size > 0 && (
                <span className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 text-xs font-bold animate-pulse">
                  ⚠️ {phoneDuplicates.size} Duplicate Phone
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Import from Excel / CSV Button */}
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Paste from Excel / CSV</span>
              </button>

              {/* Add Row Controls */}
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-[#E61C5D] hover:bg-rose-100 shadow-2xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ 1 Row</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddMultipleRows(5)}
                className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-[#E61C5D] hover:bg-rose-100 shadow-2xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ 5 Rows</span>
              </button>

              <button
                type="button"
                onClick={handleClearEmptyRows}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 shadow-2xs transition cursor-pointer"
                title="Remove empty unedited rows"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clean</span>
              </button>
            </div>
          </div>

          {/* MULTI-CUSTOMER DATA GRID */}
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF8F5] text-zinc-600 font-bold border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-2 text-center w-10">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Store / Shop Name *</th>
                    <th className="py-3 px-3 min-w-[170px]">Shopkeeper Name *</th>
                    <th className="py-3 px-3 min-w-[150px]">Mobile Phone (10 Digits) *</th>
                    <th className="py-3 px-3 min-w-[150px]">Category *</th>
                    <th className="py-3 px-3 min-w-[130px]">Village / Town *</th>
                    <th className="py-3 px-3 min-w-[120px]">District *</th>
                    <th className="py-3 px-3 min-w-[100px]">PIN Code</th>
                    <th className="py-3 px-2 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {rows.map((row, index) => {
                    const cleanPhone = row.phone.replace(/\D/g, "");
                    const isDupPhone = phoneDuplicates.has(cleanPhone);
                    const isPhoneInvalid = row.phone.trim().length > 0 && cleanPhone.length !== 10;

                    return (
                      <tr
                        key={row.clientId}
                        className={`hover:bg-zinc-50/70 transition ${
                          isDupPhone ? "bg-rose-50/50" : ""
                        }`}
                      >
                        {/* Index */}
                        <td className="py-2.5 px-2 text-center text-zinc-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Shop Name */}
                        <td className="py-2.5 px-3">
                          <input
                            required
                            type="text"
                            value={row.shopName}
                            onChange={(e) => updateRow(index, "shopName", e.target.value)}
                            placeholder="e.g. Sai Krupa General Store"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
                          />
                        </td>

                        {/* Contact Name */}
                        <td className="py-2.5 px-3">
                          <input
                            required
                            type="text"
                            value={row.contactName}
                            onChange={(e) => updateRow(index, "contactName", e.target.value)}
                            placeholder="e.g. Ramesh Patil"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
                          />
                        </td>

                        {/* Mobile Phone */}
                        <td className="py-2.5 px-3">
                          <div className="relative">
                            <input
                              required
                              type="tel"
                              maxLength={10}
                              value={row.phone}
                              onChange={(e) => updateRow(index, "phone", e.target.value.replace(/\D/g, ""))}
                              placeholder="10-digit mobile"
                              className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-mono outline-none ${
                                isDupPhone
                                  ? "border-rose-500 bg-rose-50 text-rose-950 focus:ring-1 focus:ring-rose-300"
                                  : isPhoneInvalid
                                  ? "border-amber-400 bg-amber-50 focus:ring-1 focus:ring-amber-200"
                                  : "border-zinc-200 bg-white focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
                              }`}
                            />
                            {isDupPhone && (
                              <span className="block text-[9px] font-bold text-rose-600 mt-0.5">
                                Duplicate in batch!
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3">
                          <select
                            value={row.categoryId || defaultCategoryId}
                            onChange={(e) => updateRow(index, "categoryId", e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 outline-none focus:border-rose-300"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Village / Town */}
                        <td className="py-2.5 px-3">
                          <input
                            required
                            type="text"
                            value={row.village}
                            onChange={(e) => updateRow(index, "village", e.target.value)}
                            placeholder={defaultVillage || "e.g. Hadapsar"}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-rose-300"
                          />
                        </td>

                        {/* District */}
                        <td className="py-2.5 px-3">
                          <input
                            required
                            type="text"
                            value={row.district}
                            onChange={(e) => updateRow(index, "district", e.target.value)}
                            placeholder={defaultDistrict || "e.g. Pune"}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-rose-300"
                          />
                        </td>

                        {/* PIN Code */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            maxLength={6}
                            value={row.pincode}
                            onChange={(e) => handleLookupRowPincode(index, e.target.value)}
                            placeholder={defaultPincode || "PIN"}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-mono text-zinc-900 outline-none focus:border-rose-300"
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(index)}
                              title="Duplicate row"
                              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(index)}
                              title="Delete row"
                              className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom table bar */}
            <div className="bg-[#FAF8F5] p-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-zinc-500 text-[11px]">
                Showing {rows.length} shops in table. All shops will be submitted simultaneously in a single atomic request.
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#E61C5D] hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add another shop row</span>
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-zinc-200">
            <div>
              <p className="text-xs font-bold text-zinc-800">
                Ready to upload {validatedStats.validCount} verified {validatedStats.validCount === 1 ? "customer" : "customers"}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Official Live IST timestamp ({istFormattedDate} • {istFormattedTime} IST) will be attached to every record.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || validatedStats.validCount === 0 || phoneDuplicates.size > 0}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-8 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.2)] transition hover:bg-[#c91550] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{submissionProgress || "Saving batch..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Save All {validatedStats.validCount} Customers at Once</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* MODAL: PASTE FROM EXCEL OR CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-zinc-900">
                  Paste Multiple Customers from Excel / CSV
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Copy columns from your Excel or Google Sheets document and paste them directly below. Columns should be ordered:
              <br />
              <strong className="text-zinc-800 font-mono text-[11px]">
                Shop Name [Tab] Shopkeeper [Tab] 10-Digit Phone [Tab] Village [Tab] District [Tab] PIN Code
              </strong>
            </p>

            <textarea
              rows={8}
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder={`Sai Krupa Store\tRamesh Patil\t9820123456\tHadapsar\tPune\t411028\nMahalaxmi Mart\tSunita Sharma\t9820654321\tShivajinagar\tPune\t411005`}
              className="w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3 font-mono text-xs text-zinc-900 outline-none focus:border-rose-300 focus:bg-white resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>Download Sample CSV Template</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportPastedData}
                  disabled={!pasteData.trim()}
                  className="rounded-xl bg-[#E61C5D] px-5 py-2 text-xs font-bold text-white hover:bg-[#c91550] disabled:opacity-50"
                >
                  Import into Batch Grid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
