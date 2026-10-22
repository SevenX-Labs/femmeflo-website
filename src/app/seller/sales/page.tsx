"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  IndianRupee,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Store,
  User,
  XCircle,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import { clearApiCache } from "@/lib/api/client";
import type { SaleItem } from "@/lib/api/types";
import dynamic from "next/dynamic";
const SaleDetailModal = dynamic(() =>
  import("@/components/management/SaleDetailModal").then((m) => ({ default: m.SaleDetailModal }))
);
import { useAuth } from "@/context/AuthContext";

type StatusTab = "ALL" | "CONFIRMED" | "PENDING_APPROVAL" | "REJECTED";

export default function SellerSalesPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail =
    ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const loadSales = async (
    tab = activeTab,
    pageNum = page,
    searchQuery = search,
    isManual = false
  ) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      if (isManual) {
        clearApiCache("seller/sales");
      }
      const res = await sellerApi.listSales({
        page: pageNum,
        pageSize: 20,
        status: tab === "ALL" ? undefined : tab,
        search: searchQuery.trim() || undefined,
      });

      const items = res?.sales ?? (res as any)?.items ?? [];
      setSales(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load seller sales:", err);
      if (!isManual) setSales([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSales(activeTab, page, search);
  }, [activeTab, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSales(activeTab, 1, search);
  };

  // Helper counters across current loaded batch
  const confirmedCount = sales.filter((s) => s.status === "CONFIRMED").length;
  const pendingCount = sales.filter((s) => s.status === "PENDING_APPROVAL").length;
  const rejectedCount = sales.filter((s) => s.status === "REJECTED").length;

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Sales & Approvals History"
        title="My Sales History"
        description="Comprehensive audit of all recorded sales, pending admin approvals, rejected sales with reasons, and issued tax invoices."
        action={
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => loadSales(activeTab, page, search, true)}
              disabled={loading || isRefreshing}
              title="Refresh sales list"
              className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${(loading || isRefreshing) ? "animate-spin text-[#E61C5D]" : ""}`}
              />
            </button>
            <Link
              href="/seller/sales/new"
              className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Record New Sale</span>
            </Link>
          </div>
        }
      />

      {/* KPI Metric Summary Strip */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-rose-100 bg-white p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Total Records</span>
          <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-1 block">
            {pagination.total}
          </span>
          <span className="text-[11px] text-zinc-500">All recorded transactions</span>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Confirmed</span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1 block">
            {confirmedCount}
          </span>
          <span className="text-[11px] text-emerald-700/80">Delivered &amp; invoiced</span>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending Review</span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[11px] text-amber-700/80">Below minimum price</span>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Rejected</span>
          <span className="text-xl sm:text-2xl font-extrabold text-rose-800 mt-1 block">
            {rejectedCount}
          </span>
          <span className="text-[11px] text-rose-700/80">Editable for resubmission</span>
        </div>
      </div>

      {/* Status Filter Tabs & Search */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        {/* Scrollable Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none -mx-1 px-1">
          {(
            [
              { id: "ALL", label: "All Sales" },
              { id: "CONFIRMED", label: "Confirmed" },
              { id: "PENDING_APPROVAL", label: "Pending Approval" },
              { id: "REJECTED", label: "Rejected" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#E61C5D] text-white shadow-xs"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer store name..."
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 text-xs outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </form>
      </div>

      {/* Main Ledger Card */}
      <SectionCard
        title="Detailed Sales Ledger"
        description="Every packet transaction, unit price, admin approval state, and associated tax invoice."
        className="mt-6"
      >
        {/* ================================================================= */}
        {/* MOBILE CARDS VIEW (Under lg: 1024px)                             */}
        {/* ================================================================= */}
        <div className="lg:hidden space-y-3.5">
          {loading && sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#E61C5D] mb-2" />
              <p className="text-xs font-semibold">Loading sales records...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500">
              <Package className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
              <p className="text-xs font-semibold">No sales records found for this filter.</p>
            </div>
          ) : (
            sales.map((s) => {
              const isConfirmed = s.status === "CONFIRMED";
              const isPendingAppr = s.status === "PENDING_APPROVAL";
              const isRej = s.status === "REJECTED";

              const now = new Date();
              const createdAt = new Date(s.createdAt);
              const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              const isEditableStatus = isRej || isPendingAppr;
              const canEdit = isEditableStatus && diffHours <= 48;

              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs space-y-3 transition hover:border-rose-200"
                >
                  {/* Top row: Store + Status badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D] border border-rose-100">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-950 truncate">
                          {s.customer?.shopName || "Customer Store"}
                        </h4>
                        <p className="text-xs text-zinc-500 truncate">
                          {s.customer?.contactName || "Shopkeeper"} {s.customer?.phone ? `· ${s.customer.phone}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#156035] border border-emerald-200/70">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Confirmed</span>
                        </span>
                      )}
                      {isPendingAppr && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200/70">
                          <Clock className="h-3 w-3" />
                          <span>Pending</span>
                        </span>
                      )}
                      {isRej && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-[#E61C5D] border border-rose-200/70">
                          <XCircle className="h-3 w-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rejection notice callout if present */}
                  {isRej && s.rejectionReason && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2.5 text-xs text-rose-900">
                      <p className="font-semibold text-rose-800">
                        <span className="font-bold">Reason:</span> &ldquo;{s.rejectionReason}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Key Stats Metric Grid */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#FAF8F5] border border-zinc-150 p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block">Packets</span>
                      <span className="font-extrabold text-zinc-900 text-sm mt-0.5 block">
                        {s.quantity} pkts
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block">Unit Price</span>
                      <span className="font-bold font-mono text-zinc-700 text-xs mt-0.5 block">
                        ₹{(s.unitPricePaise / 100).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block">Total Amount</span>
                      <span className="font-extrabold text-[#156035] text-sm mt-0.5 block">
                        ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Footer metadata & actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 text-xs">
                    <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                        {s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "Bank/UPI" : "Pending"}
                      </span>
                      <span>
                        {new Date(s.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      {s.invoice && (
                        <a
                          href={`/api/v1/invoices/${s.invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 hover:border-rose-200 hover:text-[#E61C5D]"
                        >
                          <FileText className="h-3 w-3 text-[#E61C5D]" />
                          <span>PDF</span>
                        </a>
                      )}

                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => setSelectedSaleId(s.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                            isRej
                              ? "border border-rose-300 bg-rose-50 text-[#E61C5D] hover:bg-rose-100 hover:border-rose-400"
                              : "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-300"
                          }`}
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>{isRej ? "Edit & Resubmit" : "Edit"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedSaleId(s.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-2xs cursor-pointer"
                        >
                          <FileText className="h-3 w-3 text-zinc-500" />
                          <span>View</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================================================================= */}
        {/* DESKTOP TABLE VIEW (lg: 1024px and up)                            */}
        {/* ================================================================= */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="pb-3.5 pr-4">Shopkeeper / Customer</th>
                <th className="pb-3.5 px-3">Packets</th>
                <th className="pb-3.5 px-3">Unit Price</th>
                <th className="pb-3.5 px-3">Total Amount</th>
                <th className="pb-3.5 px-3">Payment</th>
                <th className="pb-3.5 px-3">Date &amp; Time</th>
                <th className="pb-3.5 px-3">Approval Status</th>
                <th className="pb-3.5 px-3 text-right">Tax Invoice</th>
                <th className="pb-3.5 pl-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {sales.map((s) => {
                const isConfirmed = s.status === "CONFIRMED";
                const isPending = s.status === "PENDING_APPROVAL";
                const isRejected = s.status === "REJECTED";

                const now = new Date();
                const createdAt = new Date(s.createdAt);
                const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                const isEditableStatus = isRejected || isPending;
                const canEdit = isEditableStatus && diffHours <= 48;

                return (
                  <tr key={s.id} className="transition hover:bg-zinc-50/70">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D] border border-rose-100">
                          <Store className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="truncate text-xs font-bold text-zinc-950">
                            {s.customer?.shopName || "Customer Store"}
                          </p>
                          <p className="truncate text-[11px] text-zinc-500">
                            {s.customer?.contactName || "Shopkeeper"} {s.customer?.phone ? `· ${s.customer.phone}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-zinc-900 whitespace-nowrap">
                      {s.quantity} pkts
                    </td>
                    <td className="py-3.5 px-3 font-mono text-zinc-600 whitespace-nowrap">
                      ₹{(s.unitPricePaise / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-[#156035] whitespace-nowrap">
                      ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex rounded-md bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700">
                        {s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "Bank/UPI" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-zinc-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-3">
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#156035] border border-emerald-200/60 whitespace-nowrap">
                          <CheckCircle2 className="h-3 w-3" /> Confirmed
                        </span>
                      )}
                      {isPending && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200/60 whitespace-nowrap">
                            <Clock className="h-3 w-3" /> Pending Approval
                          </span>
                          <p className="text-[10px] text-amber-600">Low-price sale</p>
                        </div>
                      )}
                      {isRejected && (
                        <div className="space-y-1 max-w-[200px]">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-[#E61C5D] border border-rose-200/60 whitespace-nowrap">
                            <XCircle className="h-3 w-3" /> Rejected
                          </span>
                          {s.rejectionReason && (
                            <p
                              className="text-[11px] text-rose-700 font-medium leading-snug line-clamp-2"
                              title={`Rejection reason: ${s.rejectionReason}`}
                            >
                              <span className="font-bold">Reason:</span> {s.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      {s.invoice ? (
                        <a
                          href={`/api/v1/invoices/${s.invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:border-rose-200 hover:text-[#E61C5D] shadow-2xs"
                        >
                          <FileText className="h-3.5 w-3.5 text-[#E61C5D]" />
                          <span>{s.invoice.number || "Invoice"}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => setSelectedSaleId(s.id)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition shadow-2xs cursor-pointer ${
                              s.status === "REJECTED"
                                ? "border border-rose-300 bg-rose-50 text-[#E61C5D] hover:bg-rose-100 hover:border-rose-400"
                                : "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-300"
                            }`}
                            title={`Editable (${Math.floor(48 - diffHours)}h left)`}
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>{s.status === "REJECTED" ? "Edit & Resubmit" : "Edit"}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedSaleId(s.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-2xs cursor-pointer"
                            title="View sale details"
                          >
                            <FileText className="h-3 w-3 text-zinc-500" />
                            <span>View</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && sales.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-zinc-500">
                    No sales records found for this filter.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#E61C5D]" />
                      <span>Loading sales records...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-xs">
            <span className="text-zinc-500 text-center sm:text-left">
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total sales)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 shadow-2xs cursor-pointer transition"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 shadow-2xs cursor-pointer transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Sale Detail & Edit Modal */}
      {selectedSaleId && (
        <SaleDetailModal
          role="Seller"
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          onSaleUpdated={(updated) => {
            setSales((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
          }}
        />
      )}
    </DashboardShell>
  );
}
