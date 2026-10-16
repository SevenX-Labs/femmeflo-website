"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Download,
  Eye,
  ExternalLink,
  Camera,
  Loader2,
  CheckCircle2,
  Receipt,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { sellerApi } from "@/lib/api/seller";
import type { CustomerItem, SaleItem, InvoiceItem } from "@/lib/api/types";

export interface CustomerDetailModalProps {
  role: "Super Admin" | "Manager" | "Seller";
  customerId: string;
  onClose: () => void;
  onCustomerUpdated?: (updated: CustomerItem) => void;
}

export function CustomerDetailModal({
  role,
  customerId,
  onClose,
  onCustomerUpdated,
}: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF actions state
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  // Fetch customer details, sales history, and invoices
  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch customer item
        let custRes: { customer: CustomerItem };
        if (role === "Super Admin") {
          custRes = await adminApi.getCustomer(customerId);
        } else if (role === "Manager") {
          custRes = await managerApi.getCustomer(customerId);
        } else {
          custRes = await sellerApi.getCustomer(customerId);
        }

        if (!isMounted) return;
        setCustomer(custRes.customer);

        // 2. Fetch sales for this customer
        let salesList: SaleItem[] = [];
        try {
          if (role === "Super Admin") {
            const sRes = await adminApi.listSales({ customerId, pageSize: 50 });
            salesList = sRes.sales ?? (sRes as any).items ?? [];
          } else if (role === "Manager") {
            const sRes = await managerApi.listSales({ customerId, pageSize: 50 });
            salesList = sRes.sales ?? (sRes as any).items ?? [];
          } else {
            const sRes = await sellerApi.listSales({ customerId, pageSize: 50 });
            salesList = sRes.sales ?? (sRes as any).items ?? [];
          }
        } catch {
          salesList = [];
        }

        if (!isMounted) return;
        setSales(salesList);

        // 3. For Super Admin, also fetch invoices matched to this customer
        if (role === "Super Admin") {
          try {
            const invRes = await adminApi.listInvoices({ pageSize: 100 });
            const allInvoices = invRes.invoices ?? (invRes as any).items ?? [];
            const matchedInvoices = allInvoices.filter(
              (inv) =>
                inv.sale?.customerId === customerId ||
                inv.sale?.customer?.id === customerId ||
                salesList.some((s) => s.id === inv.saleId || s.invoice?.id === inv.id)
            );
            if (isMounted) {
              setInvoices(matchedInvoices);
            }
          } catch {
            if (isMounted) setInvoices([]);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load customer details";
        setError(msg);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (customerId) {
      loadDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [customerId, role]);

  const handleInvoicePdf = async (
    invoiceId: string,
    invoiceNumber?: string,
    mode: "view" | "download" = "view"
  ) => {
    const actionKey = `${invoiceId}-${mode}`;
    setPdfLoadingId(actionKey);
    setPdfError(null);
    try {
      let blob: Blob;
      if (role === "Super Admin") {
        blob = await adminApi.downloadInvoicePdf(invoiceId, mode === "download");
      } else if (role === "Manager") {
        blob = await managerApi.downloadInvoicePdf(invoiceId, mode === "download");
      } else {
        blob = await sellerApi.downloadInvoicePdf(invoiceId, mode === "download");
      }

      const blobUrl = URL.createObjectURL(blob);
      if (mode === "view") {
        const win = window.open(blobUrl, "_blank");
        if (!win) {
          const a = document.createElement("a");
          a.href = blobUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.click();
        }
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `Invoice-${invoiceNumber || invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } catch {
      setPdfError("Unable to load invoice PDF. Please try again.");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customer) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setPhotoMessage("Please upload a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMessage("Photo size must be under 5 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage(null);
    try {
      let res: { customer: CustomerItem; photoUrl: string };
      if (role === "Super Admin") {
        res = await adminApi.uploadCustomerPhoto(customer.id, file);
      } else if (role === "Manager") {
        res = await managerApi.uploadCustomerPhoto(customer.id, file);
      } else {
        res = await sellerApi.uploadCustomerPhoto(customer.id, file);
      }

      const updated = { ...customer, photoPath: res.photoUrl || (res.customer?.photoPath ?? customer.photoPath) };
      setCustomer(updated);
      setPhotoMessage("Storefront photo saved successfully!");
      if (onCustomerUpdated) onCustomerUpdated(updated);
    } catch {
      setPhotoMessage("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const fullAddress =
    customer?.address ||
    [
      customer?.shopNumber,
      customer?.streetName,
      customer?.village,
      customer?.district,
      customer?.state,
      customer?.pincode,
    ]
      .filter(Boolean)
      .join(", ") ||
    [customer?.village, customer?.district, customer?.state].filter(Boolean).join(", ");

  // Deduplicate all invoices (from direct invoices endpoint and sales invoices)
  const combinedInvoices: Array<{ id: string; number: string; date?: string; amount?: string; saleId?: string }> = [];
  const seenIds = new Set<string>();

  invoices.forEach((inv) => {
    if (!seenIds.has(inv.id)) {
      seenIds.add(inv.id);
      combinedInvoices.push({
        id: inv.id,
        number: inv.number,
        date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : undefined,
        amount: inv.sale ? `₹${(inv.sale.totalPaise / 100).toLocaleString("en-IN")}` : undefined,
        saleId: inv.saleId,
      });
    }
  });

  sales.forEach((s) => {
    if (s.invoice?.id && !seenIds.has(s.invoice.id)) {
      seenIds.add(s.invoice.id);
      combinedInvoices.push({
        id: s.invoice.id,
        number: s.invoice.number,
        date: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : undefined,
        amount: `₹${(s.totalPaise / 100).toLocaleString("en-IN")}`,
        saleId: s.id,
      });
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-[#FFF8FA] via-white to-[#F0FAF4] px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-rose-100 text-[#156035] shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61C5D]">
                  Customer &amp; Retail Profile
                </span>
                {customer?.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-800">
                    Inactive
                  </span>
                )}
              </div>
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">
                {customer?.shopName || "Customer Details"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-700 hover:bg-rose-50 hover:text-zinc-700 transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
              <Loader2 className="h-8 w-8 animate-spin text-[#E61C5D] mb-3" />
              <p className="text-sm font-medium">Loading customer data, invoices, and photo...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : customer ? (
            <>
              {/* TOP GRID: Shopkeeper Photo & Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* 1. Storefront / Shopkeeper Photo Card */}
                <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border border-zinc-200 bg-[#FAF8F5] p-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-[#E61C5D]" />
                        Storefront Photo
                      </span>
                      {customer.photoPath ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-zinc-700">Not added</span>
                      )}
                    </div>

                    <div className="relative h-48 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white flex items-center justify-center">
                      {customer.photoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={customer.photoPath}
                          alt={customer.shopName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-zinc-700 p-4 text-center">
                          <Store className="h-10 w-10 text-zinc-300 mb-1" />
                          <p className="text-xs">No shop photo uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white border border-rose-200 px-3 py-1.5 text-xs font-bold text-[#E61C5D] shadow-xs hover:bg-rose-50 transition">
                      <Camera className="h-3.5 w-3.5" />
                      {isUploadingPhoto ? "Uploading..." : customer.photoPath ? "Replace photo" : "Upload photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        disabled={isUploadingPhoto}
                        className="sr-only"
                        onChange={handlePhotoUpload}
                      />
                    </label>

                    {customer.photoPath && (
                      <a
                        href={customer.photoPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-900 hover:underline"
                      >
                        <span>Full photo</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {photoMessage && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">{photoMessage}</p>
                  )}
                </div>

                {/* 2. Contact & Territory Info */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                        Contact Information
                      </span>
                      <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                        {customer.category?.name || "General trade"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-zinc-700 block font-medium">Shopkeeper / Contact Person</span>
                        <strong className="text-sm font-bold text-zinc-800 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          {customer.contactName || "—"}
                        </strong>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-700 block font-medium">Contact Phone</span>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          {customer.phone ? (
                            <a
                              href={`tel:${customer.phone}`}
                              className="text-sm font-bold text-zinc-800 hover:text-[#E61C5D] hover:underline"
                            >
                              {customer.phone}
                            </a>
                          ) : (
                            <span className="text-zinc-800">—</span>
                          )}
                        </div>
                      </div>

                      {customer.email ? (
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-zinc-700 block font-medium">Email Address</span>
                          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                            {customer.email}
                          </span>
                        </div>
                      ) : null}

                      <div className="space-y-1">
                        <span className="text-zinc-700 block font-medium">Assigned Seller</span>
                        <strong className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-[#E61C5D] shrink-0" />
                          {customer.seller?.name || "Assigned Seller"}
                        </strong>
                        {customer.seller?.phone && (
                          <span className="text-[11px] text-zinc-800 block">
                            {customer.seller.phone}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-700 block font-medium">Customer Since</span>
                        <strong className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Address & GPS Pin Card */}
                  <div className="rounded-2xl border border-zinc-200 bg-[#F4FBF7] p-3.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="h-4 w-4 text-[#156035] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold uppercase tracking-wider text-emerald-900 block text-[11px]">
                            Shop Address &amp; Location
                          </span>
                          <p className="mt-0.5 text-zinc-700 leading-relaxed font-medium">
                            {fullAddress}
                          </p>
                        </div>
                      </div>

                      {customer.latitude && customer.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#156035] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition"
                        >
                          <span>Maps</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* GENERATED INVOICES SECTION */}
              <div className="rounded-2xl border border-emerald-200 bg-[#F4FBF7] p-4.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#156035]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                        Generated Invoices ({combinedInvoices.length})
                      </h3>
                      <p className="text-[11px] text-zinc-800">
                        Official digital tax invoices issued for orders placed by this customer
                      </p>
                    </div>
                  </div>
                </div>

                {pdfError && (
                  <p className="mb-3 text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {pdfError}
                  </p>
                )}

                {combinedInvoices.length > 0 ? (
                  <div className="divide-y divide-emerald-100/80 rounded-xl border border-emerald-100 bg-white overflow-hidden shadow-xs">
                    {combinedInvoices.map((inv) => {
                      const isViewLoading = pdfLoadingId === `${inv.id}-view`;
                      const isDlLoading = pdfLoadingId === `${inv.id}-download`;

                      return (
                        <div
                          key={inv.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-emerald-50/40 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 font-mono text-xs font-bold">
                              #
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-zinc-900">
                                  {inv.number}
                                </span>
                                {inv.amount && (
                                  <span className="text-xs font-bold text-emerald-800">
                                    {inv.amount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-800">
                                {inv.date && <span>Date: {inv.date}</span>}
                                <span>• Verified Tax Invoice</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleInvoicePdf(inv.id, inv.number, "view")}
                              disabled={Boolean(pdfLoadingId)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-50 transition disabled:opacity-50 cursor-pointer"
                            >
                              {isViewLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              <span>View PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInvoicePdf(inv.id, inv.number, "download")}
                              disabled={Boolean(pdfLoadingId)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#156035] px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0f4e2b] transition disabled:opacity-50 cursor-pointer"
                            >
                              {isDlLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin text-white" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-white/70 py-6 text-center text-xs text-zinc-800">
                    No invoices generated yet for this customer.
                  </div>
                )}
              </div>

              {/* SALES ORDER HISTORY SECTION */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#E61C5D]">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                        Sales &amp; Orders History ({sales.length})
                      </h3>
                      <p className="text-[11px] text-zinc-800">
                        Recorded packet purchases and order payment statuses
                      </p>
                    </div>
                  </div>
                </div>

                {sales.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-zinc-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-zinc-800 uppercase tracking-wider font-semibold border-b border-zinc-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Date</th>
                          <th className="px-3.5 py-2.5">Packets</th>
                          <th className="px-3.5 py-2.5">Total Amount</th>
                          <th className="px-3.5 py-2.5">Payment</th>
                          <th className="px-3.5 py-2.5">Status</th>
                          <th className="px-3.5 py-2.5 text-right">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {sales.map((s) => (
                          <tr key={s.id} className="hover:bg-zinc-50/60 transition">
                            <td className="px-3.5 py-3 font-medium text-zinc-900">
                              {new Date(s.createdAt).toLocaleDateString("en-IN")}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-zinc-900">
                              {s.quantity} pkts
                            </td>
                            <td className="px-3.5 py-3 font-bold text-emerald-800">
                              ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                                {s.paymentMode}
                              </span>
                            </td>
                            <td className="px-3.5 py-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  s.status === "CONFIRMED"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : s.status === "PENDING_APPROVAL"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-zinc-100 text-zinc-900"
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              {s.invoice?.id ? (
                                <button
                                  type="button"
                                  onClick={() => handleInvoicePdf(s.invoice!.id, s.invoice!.number, "view")}
                                  className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>{s.invoice.number}</span>
                                </button>
                              ) : (
                                <span className="text-zinc-700">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-[#FAF8F5] py-6 text-center text-xs text-zinc-800">
                    No sales orders recorded yet for this customer.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-[#FAF8F5] px-6 py-3.5">
          <p className="text-xs text-zinc-800">
            Femmeflo Customer Verification • Secure GST Records
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#156035] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
