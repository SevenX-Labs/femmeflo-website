"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  Loader2,
  PackageCheck,
  RefreshCw,
  Send,
  Truck,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { StockTransactionItem } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export default function SellerInventoryPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const [balance, setBalance] = useState(0);
  const [assigned, setAssigned] = useState(0);
  const [sold, setSold] = useState(0);
  const [locationName, setLocationName] = useState("Seller stock");
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [selectedType, setSelectedType] = useState<"ALL" | "TRANSFER" | "SALE">("ALL");

  const loadInventory = async (pageNum = page, typeFilter = selectedType) => {
    setLoading(true);
    try {
      const [invRes, txRes] = await Promise.all([
        sellerApi.getInventory().catch(() => null),
        sellerApi.listTransactions({
          page: pageNum,
          pageSize: 20,
          type: typeFilter === "ALL" ? undefined : typeFilter,
        }).catch(() => null),
      ]);

      if (invRes) {
        setBalance(invRes.balance ?? invRes.remaining ?? 0);
        setAssigned(invRes.assignedPackets ?? invRes.assigned ?? 0);
        setSold(invRes.soldPackets ?? invRes.sold ?? 0);
        setLocationName(invRes.locationName ?? invRes.name ?? "Seller stock");
      }

      if (txRes) {
        const items = txRes.transactions ?? (txRes as any).items ?? [];
        setTransactions(items);
        if (txRes.pagination) {
          setPagination(txRes.pagination);
        }
      } else {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory(page, selectedType);
  }, [page, selectedType]);

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Inventory Management"
        title="My Packets & Stock Ledger"
        description="Physical stock assigned to your custody. Confirmed customer deliveries automatically debit packets with complete ledger tracing."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadInventory(page, selectedType)}
              disabled={loading}
              title="Refresh stock"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
          </div>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Assigned"
          value={(assigned ?? 0).toString()}
          note="Cumulative depot allocation"
          icon="packages"
        />
        <MetricCard
          label="Confirmed Sold"
          value={(sold ?? 0).toString()}
          note="Deducted upon verified delivery"
          icon="packages"
          tone="green"
        />
        <MetricCard
          label="Remaining In Hand"
          value={(balance ?? 0).toString()}
          note="Available for field deliveries"
          icon="packages"
          tone="amber"
        />
      </div>

      <SectionCard
        title="Complete Stock Movement History"
        description={`Full transaction ledger for ${locationName}. Track every incoming depot stock transfer and outgoing customer sale.`}
        className="mt-8"
      >
        {/* Filter buttons */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex gap-2">
            {(
              [
                { id: "ALL", label: "All Movements" },
                { id: "TRANSFER", label: "Transfers Received (+)" },
                { id: "SALE", label: "Customer Sales Deducted (-)" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedType(f.id);
                  setPage(1);
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedType === f.id
                    ? "bg-[#E61C5D] text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-500">
            Total records: {pagination.total}
          </span>
        </div>

        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((t) => {
              const isIncoming = t.type === "TRANSFER" || t.type === "RECEIPT";

              return (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50/50 gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isIncoming ? "bg-emerald-50 text-[#157347]" : "bg-rose-50 text-[#E61C5D]"
                      }`}
                    >
                      {isIncoming ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">
                        {isIncoming
                          ? `Stock Received from ${t.source?.name || "Central Depot"}`
                          : `Sale Delivered to Shopkeeper`}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {t.saleId ? ` · Order #${t.saleId.slice(0, 8)}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isIncoming
                          ? "bg-emerald-50 text-[#157347]"
                          : "bg-rose-50 text-[#E61C5D]"
                      }`}
                    >
                      {isIncoming ? `+${t.quantity} packets` : `-${t.quantity} packets`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-sm text-zinc-500">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#E61C5D]" />
                  <span>Loading inventory movements...</span>
                </div>
              ) : (
                "No stock movements recorded yet."
              )}
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
            <span className="text-xs text-zinc-500">
              Page {pagination.page} of {pagination.totalPages}
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
    </DashboardShell>
  );
}
