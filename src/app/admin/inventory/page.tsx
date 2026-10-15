"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, Building2, PackagePlus, RefreshCw, Truck, X } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

  // Create warehouse modal state
  const searchParams = useSearchParams();
  const [showWarehouseModal, setShowWarehouseModal] = useState(searchParams.get("action") === "add-warehouse");
  const [warehouseName, setWarehouseName] = useState("");
  const [isWarehouseSubmitting, setIsWarehouseSubmitting] = useState(false);
  const [warehouseNotice, setWarehouseNotice] = useState("");
  const [warehouseError, setWarehouseError] = useState("");

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

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = warehouseName.trim();
    if (!trimmed) {
      setWarehouseError("Please enter a warehouse name.");
      return;
    }

    setIsWarehouseSubmitting(true);
    setWarehouseError("");
    setWarehouseNotice("");

    try {
      await adminApi.createWarehouse({ name: trimmed });
      setWarehouseNotice(`Successfully created warehouse "${trimmed}".`);
      setWarehouseName("");
      await fetchInventory();
      setTimeout(() => {
        setShowWarehouseModal(false);
        setWarehouseNotice("");
      }, 1200);
    } catch (err: unknown) {
      setWarehouseError(err instanceof Error ? err.message : "Failed to create warehouse.");
    } finally {
      setIsWarehouseSubmitting(false);
    }
  };

  const stockHierarchy = [
    { level: "HQ stock", location: "Central Office Warehouse", rawBalance: data?.hqStock ?? 0, balance: (data?.hqStock ?? 0).toLocaleString("en-IN"), role: "Central Reserve" },
    { level: "Regional depots", location: `${(data?.warehouses ?? []).filter(w => w.type === "WAREHOUSE").length} Registered Depots`, rawBalance: data?.warehouseStock ?? 0, balance: (data?.warehouseStock ?? 0).toLocaleString("en-IN"), role: "Buffer Stock" },
    { level: "Seller stock", location: "Active Field Sellers", rawBalance: data?.sellerStock ?? 0, balance: (data?.sellerStock ?? 0).toLocaleString("en-IN"), role: "Field Retail" },
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
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={fetchInventory}
              disabled={loading}
              title="Refresh live stock"
              className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-xs transition hover:border-rose-200 hover:text-[#E61C5D] active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              onClick={() => {
                setShowInwardModal(true);
                setInwardError("");
                setInwardNotice("");
              }}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-[#156035] px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(21,96,53,0.18)] hover:bg-[#0f4e2b] active:scale-[0.98] transition"
            >
              <PackagePlus className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">Stock Inward</span>
            </button>
            <button
              onClick={() => {
                setShowWarehouseModal(true);
                setWarehouseError("");
                setWarehouseNotice("");
              }}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-zinc-700 shadow-xs hover:border-rose-200 hover:text-[#E61C5D] active:scale-[0.98] transition"
            >
              <Building2 className="h-4 w-4 shrink-0 text-[#E61C5D]" /> <span className="whitespace-nowrap">Add Warehouse</span>
            </button>
            <Link
              href="/admin/inventory/transfers"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] active:scale-[0.98] transition"
            >
              <Truck className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">Allocate stock</span>
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
        {(!data || (data.totalInventory === 0 && (!data.warehouses || data.warehouses.length === 0))) ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#E61C5D]">
              <Package className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-800">No Inventory or Locations Found</h4>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
              Your inventory database is completely empty. Start from scratch by inwarding your first stock batch above.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowInwardModal(true);
                  setInwardError("");
                  setInwardNotice("");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0f4e2b] transition"
              >
                <PackagePlus className="h-4 w-4" /> Stock Receipt / Inward
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Cards (shown on small screens) */}
            <div className="divide-y divide-rose-100 sm:hidden">
              {/* HQ Card */}
              <div className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> HQ Central
                  </span>
                  <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-[#156035]">
                    {(data?.hqStock ?? 0).toLocaleString("en-IN")} pkts
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                  <span>Central Office Warehouse</span>
                  <span className="text-[11px] font-medium text-zinc-400">Central Reserve</span>
                </div>
              </div>

              {/* Warehouses */}
              {(data?.warehouses ?? []).filter((w) => w.type === "WAREHOUSE").map((wh) => (
                <div key={wh.id} className="py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Regional Depot
                    </span>
                    <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                      {wh.balance.toLocaleString("en-IN")} pkts
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                    <span className="truncate pr-2 font-medium">{wh.name}</span>
                    <span className="shrink-0 text-[11px] font-medium text-zinc-400">Buffer Stock</span>
                  </div>
                </div>
              ))}

              {/* Sellers */}
              {(data?.warehouses ?? []).filter((w) => w.type === "SELLER").map((sl) => (
                <div key={sl.id} className="py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Field Seller
                    </span>
                    <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                      {sl.balance.toLocaleString("en-IN")} pkts
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                    <span className="truncate pr-2 font-medium">{sl.name}</span>
                    <span className="shrink-0 text-[11px] font-medium text-zinc-400">Field Custody</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (shown on sm and up) */}
            <div className="hidden sm:block overflow-x-auto">
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
                  {/* 1. HQ */}
                  <tr className="hover:bg-[#FFFDFD]">
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> HQ Central
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-zinc-700">Central Office Warehouse</td>
                    <td className="px-4 py-4 text-xs font-semibold text-zinc-500">Central Reserve</td>
                    <td className="px-4 py-4 text-sm font-bold text-[#156035]">{(data?.hqStock ?? 0).toLocaleString("en-IN")} pkts</td>
                  </tr>

                  {/* 2. Specific Warehouses */}
                  {(data?.warehouses ?? []).filter((w) => w.type === "WAREHOUSE").map((wh) => (
                    <tr key={wh.id} className="hover:bg-[#FFFDFD]">
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
                          <span className="h-2 w-2 rounded-full bg-amber-500" /> Regional Depot
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-zinc-700">{wh.name}</td>
                      <td className="px-4 py-4 text-xs font-semibold text-zinc-500">Buffer Stock</td>
                      <td className="px-4 py-4 text-sm font-bold text-amber-700">{wh.balance.toLocaleString("en-IN")} pkts</td>
                    </tr>
                  ))}

                  {/* 3. Specific Sellers */}
                  {(data?.warehouses ?? []).filter((w) => w.type === "SELLER").map((sl) => (
                    <tr key={sl.id} className="hover:bg-[#FFFDFD]">
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
                          <span className="h-2 w-2 rounded-full bg-rose-500" /> Field Seller
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-zinc-700">{sl.name}</td>
                      <td className="px-4 py-4 text-xs font-semibold text-zinc-500">Field Custody</td>
                      <td className="px-4 py-4 text-sm font-bold text-rose-700">{sl.balance.toLocaleString("en-IN")} pkts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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
      {/* Add Regional Warehouse Modal */}
      {showWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-zinc-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-rose-50 p-2 text-[#E61C5D]">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-playfair text-lg font-bold text-zinc-900">Add Regional Warehouse</h3>
                  <p className="text-xs text-zinc-500">Create a regional depot for buffer packet storage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWarehouseModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="mt-5 space-y-4">
              {warehouseError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">
                  {warehouseError}
                </p>
              )}
              {warehouseNotice && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  {warehouseNotice}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  Warehouse / Depot Name *
                </label>
                <input
                  type="text"
                  required
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="e.g. Thane Regional Depot"
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWarehouseSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:opacity-50 transition"
                >
                  {isWarehouseSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Warehouse"
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
