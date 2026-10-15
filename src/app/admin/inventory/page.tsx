"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, PackagePlus, RefreshCw, Truck, X } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/api/admin";
import type { InventorySummaryData } from "@/lib/api/types";

export default function AdminInventoryPage() {
  const [data, setData] = useState<InventorySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inward stock modal state
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardQty, setInwardQty] = useState<number | string>(500);
  const [isInwardSubmitting, setIsInwardSubmitting] = useState(false);
  const [inwardNotice, setInwardNotice] = useState("");
  const [inwardError, setInwardError] = useState("");

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getInventorySummary();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backend unavailable";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleInwardStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(inwardQty);
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      setInwardError("Please enter a valid positive packet quantity.");
      return;
    }

    setIsInwardSubmitting(true);
    setInwardError("");
    setInwardNotice("");

    try {
      await adminApi.addReceipt({ quantity: qty });
      setInwardNotice(`Successfully inwarded ${qty.toLocaleString("en-IN")} packets to HQ.`);
      setInwardQty(500);
      await fetchInventory();
      setTimeout(() => {
        setShowInwardModal(false);
        setInwardNotice("");
      }, 1200);
    } catch (err: unknown) {
      setInwardError(err instanceof Error ? err.message : "Failed to process stock inward.");
    } finally {
      setIsInwardSubmitting(false);
    }
  };

  const stockHierarchy = [
    { level: "HQ stock", location: "Central Office Warehouse", balance: (data?.hqStock ?? 0).toLocaleString("en-IN"), role: "Central Reserve" },
    { level: "Regional depots", location: `${(data?.warehouses ?? []).filter(w => w.type === "WAREHOUSE").length} Registered Depots`, balance: (data?.warehouseStock ?? 0).toLocaleString("en-IN"), role: "Buffer Stock" },
    { level: "Seller stock", location: "Active Field Sellers", balance: (data?.sellerStock ?? 0).toLocaleString("en-IN"), role: "Field Retail" },
  ];

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Inventory management"
        title="Stock position"
        description="Follow every packet from HQ central warehouse to regional depots, seller allocations, confirmed sales, and remaining physical balance."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchInventory}
              disabled={loading}
              title="Refresh live stock"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              onClick={() => {
                setShowInwardModal(true);
                setInwardError("");
                setInwardNotice("");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(21,96,53,0.18)] hover:bg-[#0f4e2b] transition"
            >
              <PackagePlus className="h-4 w-4" /> Stock Receipt / Inward
            </button>
            <Link
              href="/admin/inventory/transfers"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] transition"
            >
              <Truck className="h-4 w-4" /> Allocate stock
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <span>Unable to load live inventory counts. ({error})</span>
          <button onClick={fetchInventory} className="underline hover:text-amber-950 font-bold">Retry</button>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Available System Stock"
          value={(data?.totalInventory ?? 0).toLocaleString("en-IN")}
          note="Total verified packets across all locations"
          icon="package"
          tone="green"
        />
        <MetricCard
          label="In Regional Warehouses"
          value={(data?.warehouseStock ?? 0).toLocaleString("en-IN")}
          note="Ready for seller replenishment"
          icon="packages"
          tone="amber"
        />
        <MetricCard
          label="In Seller Custody"
          value={(data?.sellerStock ?? 0).toLocaleString("en-IN")}
          note="Ready for retail store sales"
          icon="packages"
          tone="rose"
        />
      </div>

      <SectionCard title="Stock hierarchy & locations" description="Real-time physical distribution by echelon" className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead className="bg-[#FFF8FA] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
              <tr>
                <th className="px-4 py-4">Level</th>
                <th className="px-4 py-4">Location identifier</th>
                <th className="px-4 py-4">Operating role</th>
                <th className="px-4 py-4">Physical balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stockHierarchy.map((item) => (
                <tr key={item.level} className="hover:bg-[#FFFDFD]">
                  <td className="px-4 py-5">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Package className="h-4 w-4 text-[#E61C5D]" />
                      {item.level}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-sm text-zinc-600">{item.location}</td>
                  <td className="px-4 py-5 text-sm text-zinc-500">{item.role}</td>
                  <td className="px-4 py-5 text-sm font-bold text-[#156035]">{item.balance} pkts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Stock Inward / Receipt Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-zinc-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-emerald-50 p-2 text-[#156035]">
                  <PackagePlus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-playfair text-lg font-bold text-zinc-900">Stock Receipt / Inward</h3>
                  <p className="text-xs text-zinc-500">Record newly manufactured packets received at HQ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInwardStock} className="mt-5 space-y-4">
              {inwardError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">
                  {inwardError}
                </p>
              )}
              {inwardNotice && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  {inwardNotice}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  Packets Received at HQ *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={inwardQty}
                  onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
                <p className="mt-1 text-[11px] text-zinc-400">
                  Packets are incremented into the central Headquarters (HQ) reserve.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:bg-zinc-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInwardSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#156035] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#0f4e2b] disabled:opacity-50 transition"
                >
                  {isInwardSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Inwarding...
                    </>
                  ) : (
                    "Inward Stock to HQ"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
