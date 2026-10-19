"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Store,
  Calendar,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Edit3,
  Clock,
  Package,
  IndianRupee,
  CreditCard,
  Building2,
  ExternalLink,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { sellerApi } from "@/lib/api/seller";
import type { CustomerItem, SaleItem } from "@/lib/api/types";

export interface SaleDetailModalProps {
  role: "Super Admin" | "Manager" | "Seller";
  saleId: string;
  onClose: () => void;
  onSaleUpdated?: (updated: SaleItem) => void;
}

export function SaleDetailModal({
  role,
  saleId,
  onClose,
  onSaleUpdated,
}: SaleDetailModalProps) {
  const [sale, setSale] = useState<SaleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Editable Form fields
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editQuantity, setEditQuantity] = useState<number | string>(1);
  const [editUnitPrice, setEditUnitPrice] = useState<number | string>(25);
  const [editPaymentMode, setEditPaymentMode] = useState<"CASH" | "BANK" | "PENDING">("CASH");
  const [customers, setCustomers] = useState<CustomerItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      setIsLoading(true);
      setError(null);
      try {
        let sRes: { sale: SaleItem };
        if (role === "Super Admin") {
          sRes = await adminApi.getSale(saleId);
        } else if (role === "Manager") {
          sRes = await managerApi.getSale(saleId);
        } else {
          sRes = await sellerApi.getSale(saleId);
        }

        if (!isMounted) return;
        const s = sRes.sale;
        setSale(s);
        setEditCustomerId(s.customerId);
        setEditQuantity(s.quantity);
        setEditUnitPrice(s.unitPricePaise / 100);
        setEditPaymentMode(s.paymentMode as any);

        // Fetch customer list for customer selection dropdown
        try {
          let cRes: { customers?: CustomerItem[]; items?: CustomerItem[] };
          if (role === "Super Admin") {
            cRes = await adminApi.listCustomers({ pageSize: 100 });
          } else if (role === "Manager") {
            cRes = await managerApi.listCustomers({ pageSize: 100 });
          } else {
            cRes = await sellerApi.listCustomers({ pageSize: 100 });
          }
          if (isMounted) {
            setCustomers(cRes.customers ?? cRes.items ?? []);
          }
        } catch {
          // ignore
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load sale details.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [role, saleId]);

  // Calculate 48h validity for Seller
  const isSeller = role === "Seller";
  const now = new Date();
  const createdAt = sale ? new Date(sale.createdAt) : new Date();
  const hoursSinceCreation = sale ? (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : 0;
  const sellerCanEdit = !isSeller || hoursSinceCreation <= 48;
  const hoursRemaining = Math.max(0, 48 - hoursSinceCreation);

  const calculatedTotal = Number(editQuantity) * Number(editUnitPrice);

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    if (isSeller && !sellerCanEdit) {
      setSaveError("Editing period expired. Field officers can only edit within 48 hours of sale creation.");
      return;
    }

    const qty = Number(editQuantity);
    const unitPrice = Number(editUnitPrice);

    if (isNaN(qty) || qty <= 0) {
      setSaveError("Please enter a valid packet quantity.");
      return;
    }
    if (isNaN(unitPrice) || unitPrice <= 0) {
      setSaveError("Please enter a valid unit price.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const payload = {
      customerId: editCustomerId || undefined,
      quantity: qty,
      unitPricePaise: Math.round(unitPrice * 100),
      paymentMode: editPaymentMode,
    };

    try {
      let res: { sale: SaleItem };
      if (role === "Super Admin") {
        res = await adminApi.updateSale(sale.id, payload);
      } else if (role === "Manager") {
        res = await managerApi.updateSale(sale.id, payload);
      } else {
        res = await sellerApi.updateSale(sale.id, payload);
      }

      setSale(res.sale);
      setSaveSuccess("Sale record updated successfully!");
      if (onSaleUpdated) {
        onSaleUpdated(res.sale);
      }
      setTimeout(() => {
        setIsEditMode(false);
        setSaveSuccess(null);
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update sale record.");
    } finally {
      setIsSaving(false);
    }
  };

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
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl overscroll-contain"
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
                  Sale Record
                </span>
                {sale?.status === "CONFIRMED" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmed
                  </span>
                ) : sale?.status === "PENDING_APPROVAL" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    <Clock className="h-3 w-3" />
                    Approval Required
                  </span>
                ) : (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                    Rejected
                  </span>
                )}
              </div>
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">
                {sale?.customer?.shopName || "Sale Details"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sale && (
              <button
                type="button"
                onClick={() => {
                  if (!isEditMode && sale) {
                    setEditCustomerId(sale.customerId);
                    setEditQuantity(sale.quantity);
                    setEditUnitPrice(sale.unitPricePaise / 100);
                    setEditPaymentMode(sale.paymentMode as any);
                  }
                  setIsEditMode(!isEditMode);
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
                disabled={isSeller && !sellerCanEdit}
                title={
                  isSeller && !sellerCanEdit
                    ? "Editing window expired (exceeded 48 hours)"
                    : "Edit sale details"
                }
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                  isSeller && !sellerCanEdit
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                    : isEditMode
                    ? "bg-zinc-800 text-white hover:bg-zinc-900"
                    : "border border-rose-200 bg-white text-[#E61C5D] hover:bg-rose-50"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditMode ? "Cancel Edit" : "Edit Sale"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-700 hover:bg-rose-50 hover:text-zinc-700 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 48-Hour Timer Badge for Seller */}
        {sale && isSeller && (
          <div
            className={`px-6 py-2 border-b text-xs flex items-center justify-between ${
              sellerCanEdit
                ? "bg-amber-50/80 border-amber-200 text-amber-900 font-medium"
                : "bg-rose-50 border-rose-200 text-rose-900 font-semibold"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {sellerCanEdit ? (
                  <>
                    Seller edit window active:{" "}
                    <strong>{Math.floor(hoursRemaining)}h {Math.round((hoursRemaining % 1) * 60)}m</strong> remaining
                    (48h limit).
                  </>
                ) : (
                  <>
                    48-hour seller edit window expired. Only managers or super admins can modify this sale.
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
              <Loader2 className="h-8 w-8 animate-spin text-[#E61C5D] mb-3" />
              <p className="text-sm font-medium">Loading sale record details...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : sale ? (
            isEditMode ? (
              /* ========================================================= */
              /* EDIT MODE FORM                                            */
              /* ========================================================= */
              <form onSubmit={handleSaveSale} className="space-y-5">
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

                <div className="rounded-2xl border border-zinc-200 bg-[#FCFAF6] p-4.5 space-y-4">
                  <div className="border-b border-zinc-200/70 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                      <Edit3 className="h-4 w-4 text-[#156035]" />
                      Modify Sale Information
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-700 mb-1">
                        Retail Customer Store <span className="text-[#E61C5D]">*</span>
                      </label>
                      <select
                        value={editCustomerId}
                        onChange={(e) => setEditCustomerId(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.shopName} ({c.contactName} - {c.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Packet Quantity <span className="text-[#E61C5D]">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={editQuantity}
                        onChange={(e) =>
                          setEditQuantity(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Unit Price (₹ per packet) <span className="text-[#E61C5D]">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={editUnitPrice}
                        onChange={(e) =>
                          setEditUnitPrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-700 mb-1">
                        Payment Mode <span className="text-[#E61C5D]">*</span>
                      </label>
                      <select
                        value={editPaymentMode}
                        onChange={(e) => setEditPaymentMode(e.target.value as any)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      >
                        <option value="CASH">Cash Payment</option>
                        <option value="BANK">Bank Transfer / UPI</option>
                        <option value="PENDING">Pending Payment (Collect Later)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs font-semibold text-emerald-950">
                      <span>Calculated Total Amount:</span>
                      <span className="font-extrabold text-sm text-[#156035]">
                        ₹{calculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setSaveError(null);
                      setSaveSuccess(null);
                    }}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating Sale...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Sale Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* ========================================================= */
              /* VIEW MODE                                                 */
              /* ========================================================= */
              <div className="space-y-5">
                {/* Sale Quick Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-zinc-100 bg-[#FAF8F5] p-3 text-center">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Packets</span>
                    <strong className="text-base font-extrabold text-zinc-900 block mt-0.5">
                      {sale.quantity} pkts
                    </strong>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-[#FAF8F5] p-3 text-center">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Unit Price</span>
                    <strong className="text-base font-extrabold text-zinc-900 block mt-0.5">
                      ₹{(sale.unitPricePaise / 100).toFixed(2)}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-[#FAF8F5] p-3 text-center">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Total Amount</span>
                    <strong className="text-base font-extrabold text-[#156035] block mt-0.5">
                      ₹{(sale.totalPaise / 100).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-[#FAF8F5] p-3 text-center">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Payment</span>
                    <strong className="text-xs font-bold text-zinc-800 block mt-1">
                      {sale.paymentMode === "CASH" ? "Cash" : sale.paymentMode === "BANK" ? "Bank / UPI" : "Pending"}
                    </strong>
                  </div>
                </div>

                {/* Details Section */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="font-bold uppercase tracking-wider text-zinc-700">
                      Customer & Officer Details
                    </span>
                    <span className="text-zinc-400">
                      ID: {sale.id.slice(0, 8)}...
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-zinc-400 block font-medium">Customer Store</span>
                      <strong className="text-sm font-bold text-zinc-900">
                        {sale.customer?.shopName || "—"}
                      </strong>
                      <p className="text-zinc-500 text-[11px]">
                        {sale.customer?.contactName} {sale.customer?.phone ? `• ${sale.customer.phone}` : ""}
                      </p>
                    </div>

                    <div>
                      <span className="text-zinc-400 block font-medium">Field Officer (Seller)</span>
                      <strong className="text-sm font-bold text-zinc-900">
                        {sale.seller?.name || "Assigned Officer"}
                      </strong>
                      <p className="text-zinc-500 text-[11px]">
                        {sale.seller?.phone || "No phone"}
                      </p>
                    </div>

                    <div>
                      <span className="text-zinc-400 block font-medium">Recorded Date & Time</span>
                      <strong className="text-zinc-800">
                        {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </div>

                    <div>
                      <span className="text-zinc-400 block font-medium">Invoice Document</span>
                      {sale.invoice ? (
                        <a
                          href={`/api/v1/invoices/${sale.invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>{sale.invoice.number}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-400">Pending Invoice</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-[#FAF8F5] px-6 py-3.5">
          <p className="text-xs text-zinc-500">
            Femmeflo Sales Ledger • {isSeller ? (sellerCanEdit ? "Editable within 48h" : "48h edit period closed") : "Manager/Admin editable"}
          </p>
          <div className="flex items-center gap-2.5">
            {!isEditMode && sale && (!isSeller || sellerCanEdit) && (
              <button
                type="button"
                onClick={() => {
                  setEditCustomerId(sale.customerId);
                  setEditQuantity(sale.quantity);
                  setEditUnitPrice(sale.unitPricePaise / 100);
                  setEditPaymentMode(sale.paymentMode as any);
                  setIsEditMode(true);
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-[#E61C5D] hover:bg-rose-50 transition cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Sale</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl bg-[#156035] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
