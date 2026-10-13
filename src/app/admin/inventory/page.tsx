"use client";

import { useEffect, useState } from "react";
import { Package, RefreshCw, Truck } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/api/admin";
import type { InventorySummaryData } from "@/lib/api/types";

export default function AdminInventoryPage() {
  const [data, setData] = useState<InventorySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <Link
              href="/admin/inventory/transfers"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550]"
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
    </DashboardShell>
  );
}
