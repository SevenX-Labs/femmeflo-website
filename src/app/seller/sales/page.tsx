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
  FileText,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Store,
  XCircle,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { SaleItem } from "@/lib/api/types";
import dynamic from "next/dynamic";
const SaleDetailModal = dynamic(() => import("@/components/management/SaleDetailModal").then(m => ({ default: m.SaleDetailModal })));
import { useAuth } from "@/context/AuthContext";

type StatusTab = "ALL" | "CONFIRMED" | "PENDING_APPROVAL" | "REJECTED";

export default function SellerSalesPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [isPending, startTransition] = useTransition();
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const loadSales = async (tab = activeTab, pageNum = page, searchQuery = search) => {
    setLoading(true);
    try {
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
      setSales([]);
    } finally {
      setLoading(false);
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

  // Helper counters
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadSales(activeTab, page, search)}
              disabled={loading}
              title="Refresh sales list"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <Link
              href="/seller/sales/new"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550]"
            >
              <Plus className="h-4 w-4" /> Record New Sale
            </Link>
          </div>
        }
      />

      {/* Status Filter Tabs */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "ALL", label: "All Sales" },
              { id: "CONFIRMED", label: "Confirmed / Delivered" },
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
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
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
        <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer shop name..."
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 text-xs outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </form>
      </div>

      {/* Main Table Card */}
      <SectionCard
        title="Detailed Sales Ledger"
        description="Every packet transaction, unit price, admin approval state, and associated tax invoice."
        className="mt-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="pb-3.5">Shopkeeper / Customer</th>
                <th className="pb-3.5">Packets</th>
                <th className="pb-3.5">Unit Price</th>
                <th className="pb-3.5">Total Amount</th>
                <th className="pb-3.5">Payment</th>
                <th className="pb-3.5">Date & Time</th>
                <th className="pb-3.5">Approval Status</th>
                <th className="pb-3.5 text-right">Tax Invoice</th>
                <th className="pb-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sales.map((s) => {
                const isConfirmed = s.status === "CONFIRMED";
                const isPending = s.status === "PENDING_APPROVAL";
                const isRejected = s.status === "REJECTED";

                return (
                  <tr key={s.id} className="transition hover:bg-zinc-50/60">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                          <Store className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-900">
                            {s.customer?.shopName || "Customer Store"}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {s.customer?.contactName || "Shopkeeper"} {s.customer?.phone ? `· ${s.customer.phone}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-semibold text-zinc-900">
                      {s.quantity} pkts
                    </td>
                    <td className="py-4 text-xs font-mono text-zinc-600">
                      ₹{(s.unitPricePaise / 100).toFixed(2)}
                    </td>
                    <td className="py-4 text-sm font-bold text-zinc-900">
                      ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4">
                      <span className="inline-flex rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        {s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "Bank" : "Pending"}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-zinc-500">
                      {new Date(s.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4">
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#156035]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                        </span>
                      )}
                      {isPending && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <Clock className="h-3.5 w-3.5" /> Pending Approval
                          </span>
                          <p className="text-[10px] text-amber-600">Low-price sale</p>
                        </div>
                      )}
                      {isRejected && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-[#E61C5D]">
                            <XCircle className="h-3.5 w-3.5" /> Rejected
                          </span>
                          {s.rejectionReason && (
                            <p className="max-w-[180px] truncate text-[11px] text-rose-600" title={s.rejectionReason}>
                              {s.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {s.invoice ? (
                        <a
                          href={`/api/v1/invoices/${s.invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 hover:border-rose-200 hover:text-[#E61C5D]"
                        >
                          <FileText className="h-3.5 w-3.5 text-[#E61C5D]" />
                          <span>{s.invoice.number || "Invoice"}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {(() => {
                        const now = new Date();
                        const createdAt = new Date(s.createdAt);
                        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                        const canEdit = diffHours <= 48 && s.status !== "REJECTED";

                        return (
                          <button
                            type="button"
                            onClick={() => setSelectedSaleId(s.id)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                              canEdit
                                ? "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-300"
                                : "border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                            }`}
                            title={canEdit ? `Editable (${Math.floor(48 - diffHours)}h left)` : "View sale details (48h edit period closed)"}
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>{canEdit ? "Edit" : "View"}</span>
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}

              {!loading && sales.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-zinc-500">
                    No sales records found for this filter.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-zinc-500">
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

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
            <span className="text-xs text-zinc-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total sales)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>
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
