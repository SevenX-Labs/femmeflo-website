"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  History,
  Info,
  Layers,
  Loader2,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  Search,
  Store,
  Truck,
  Users,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import { DashboardShell, PageHeading } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import type { InventorySummaryData, StockTransactionItem, WarehouseItem } from "@/lib/api/types";

export default function AdminInventoryPage() {
  const [data, setData] = useState<InventorySummaryData | null>(null);
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter tabs for locations & warehouses
  const [activeTab, setActiveTab] = useState<"all" | "hq" | "warehouses" | "sellers">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // History filtering
  const [historyFilterType, setHistoryFilterType] = useState<string>("ALL");
  const [historySearch, setHistorySearch] = useState("");

  // Inward stock modal state
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardQty, setInwardQty] = useState<number | string>(500);
  const [isInwardSubmitting, setIsInwardSubmitting] = useState(false);
  const [inwardNotice, setInwardNotice] = useState("");
  const [inwardError, setInwardError] = useState("");

  // Create warehouse modal state
  const searchParams = useSearchParams();
  const [showWarehouseModal, setShowWarehouseModal] = useState(
    searchParams.get("action") === "add-warehouse"
  );
  const [warehouseName, setWarehouseName] = useState("");
  const [isWarehouseSubmitting, setIsWarehouseSubmitting] = useState(false);
  const [warehouseNotice, setWarehouseNotice] = useState("");
  const [warehouseError, setWarehouseError] = useState("");

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, txRes] = await Promise.all([
        adminApi.getInventorySummary(),
        adminApi.listTransactions().catch(() => ({ transactions: [] })),
      ]);
      setData(invRes);
      const txs = txRes?.transactions ?? (txRes as any)?.items ?? [];
      setTransactions(txs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backend unavailable";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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
      setInwardNotice(`Successfully inwarded ${qty.toLocaleString("en-IN")} packets to HQ Central.`);
      setInwardQty(500);
      await fetchAllData();
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
      await fetchAllData();
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

  // Grouped location calculations
  const allLocations: WarehouseItem[] = useMemo(() => {
    return data?.warehouses ?? data?.locations ?? [];
  }, [data]);

  const hqWarehouses = useMemo(() => {
    return allLocations.filter((l) => l.type === "HQ");
  }, [allLocations]);

  const regionalWarehouses = useMemo(() => {
    return allLocations.filter((l) => l.type === "WAREHOUSE");
  }, [allLocations]);

  const sellerWarehouses = useMemo(() => {
    return allLocations.filter((l) => l.type === "SELLER");
  }, [allLocations]);

  // Filtered warehouses/locations based on tab & search
  const displayedLocations = useMemo(() => {
    let list: WarehouseItem[] = [];
    if (activeTab === "all") list = allLocations;
    else if (activeTab === "hq") list = hqWarehouses;
    else if (activeTab === "warehouses") list = regionalWarehouses;
    else if (activeTab === "sellers") list = sellerWarehouses;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => item.name.toLowerCase().includes(q));
  }, [activeTab, allLocations, hqWarehouses, regionalWarehouses, sellerWarehouses, searchQuery]);

  // Transaction history filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (historyFilterType !== "ALL" && tx.type !== historyFilterType) {
        return false;
      }
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      const sName = tx.source?.name?.toLowerCase() || "";
      const dName = tx.destination?.name?.toLowerCase() || "";
      const actor = tx.actor?.name?.toLowerCase() || "";
      return sName.includes(q) || dName.includes(q) || actor.includes(q);
    });
  }, [transactions, historyFilterType, historySearch]);

  const totalStock = data?.totalInventory ?? 0;
  const hqStock = data?.hqStock ?? 0;
  const whStock = data?.warehouseStock ?? 0;
  const slStock = data?.sellerStock ?? 0;

  // Percentage distribution calculations
  const hqPercent = totalStock > 0 ? Math.round((hqStock / totalStock) * 100) : 0;
  const whPercent = totalStock > 0 ? Math.round((whStock / totalStock) * 100) : 0;
  const slPercent = totalStock > 0 ? Math.round((slStock / totalStock) * 100) : 0;

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Enterprise Inventory & Logistics"
        title="Stock Position & Warehouses"
        description="Comprehensive real-time stock hierarchy, warehouse-wise packet balances, and full dispatch movement history with timestamps."
        action={
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={fetchAllData}
              disabled={loading}
              title="Refresh live stock"
              className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xs transition hover:border-rose-200 hover:text-[#E61C5D] active:scale-95 disabled:opacity-50"
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
              <PackagePlus className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Stock Inward</span>
            </button>
            <button
              onClick={() => {
                setShowWarehouseModal(true);
                setWarehouseError("");
                setWarehouseNotice("");
              }}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-zinc-900 shadow-xs hover:border-rose-200 hover:text-[#E61C5D] active:scale-[0.98] transition"
            >
              <Building2 className="h-4 w-4 shrink-0 text-[#E61C5D]" />
              <span className="whitespace-nowrap">Add Warehouse</span>
            </button>
            <Link
              href="/admin/inventory/transfers"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] active:scale-[0.98] transition"
            >
              <Truck className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Transfer Stock</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
          <span>Unable to sync live inventory counts: {error}</span>
          <button onClick={fetchAllData} className="underline hover:text-amber-950 font-bold">
            Retry
          </button>
        </div>
      )}

      {/* 1. TOP-LEVEL STOCK METRICS CARDS */}
      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Stock */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Total System Stock
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#156035]">
              <Boxes className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
              {totalStock.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-zinc-600">packets</span>
          </div>
          <p className="mt-1 text-xs text-zinc-600">Across all depots, central & sellers</p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full bg-[#156035] rounded-full w-full" />
          </div>
        </div>

        {/* Central Reserve */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              HQ Central Reserve
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#156035]">
              <WarehouseIcon className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
              {hqStock.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              {hqPercent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-600">Stored at main headquarters hub</p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(hqPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Regional Warehouses */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Regional Warehouses
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
              {whStock.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
              {whPercent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            In {regionalWarehouses.length} active regional depot{regionalWarehouses.length === 1 ? "" : "s"}
          </p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(whPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Field Seller Custody */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Field Seller Custody
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
              <Store className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
              {slStock.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full">
              {slPercent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Across {sellerWarehouses.length} field representative{sellerWarehouses.length === 1 ? "" : "s"}
          </p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full bg-[#E61C5D] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(slPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. VISUAL INVENTORY PIPELINE SUMMARY BAR */}
      <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#E61C5D]" /> Stock Distribution Pipeline
            </h3>
            <p className="text-xs text-zinc-600">
              Physical inventory allocation ratio across the distribution tiers
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#156035]" /> HQ Reserve ({hqPercent}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Regional Depots ({whPercent}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E61C5D]" /> Field Sellers ({slPercent}%)
            </span>
          </div>
        </div>

        {/* Multi-segment distribution progress bar */}
        <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-100 p-0.5">
          <div
            style={{ width: `${hqPercent}%` }}
            title={`HQ Reserve: ${hqStock} pkts (${hqPercent}%)`}
            className="h-full bg-[#156035] first:rounded-l-full last:rounded-r-full transition-all duration-500"
          />
          <div
            style={{ width: `${whPercent}%` }}
            title={`Regional Warehouses: ${whStock} pkts (${whPercent}%)`}
            className="h-full bg-amber-500 first:rounded-l-full last:rounded-r-full transition-all duration-500"
          />
          <div
            style={{ width: `${slPercent}%` }}
            title={`Field Sellers: ${slStock} pkts (${slPercent}%)`}
            className="h-full bg-[#E61C5D] first:rounded-l-full last:rounded-r-full transition-all duration-500"
          />
        </div>
      </div>

      {/* 3. WAREHOUSES & LOCATIONS BREAKDOWN (WHICH WAREHOUSE CONTAINS WHAT) */}
      <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <h3 className="font-playfair text-lg font-bold text-zinc-950">
              Warehouse & Location Stock Ledger
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              Specific packet balances currently held in each warehouse and seller depot
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search location */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search warehouse..."
                className="h-10 w-full sm:w-56 rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-9 pr-3 text-xs font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center rounded-xl bg-zinc-100 p-1 text-xs font-bold text-zinc-700">
              <button
                onClick={() => setActiveTab("all")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === "all" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                All ({allLocations.length})
              </button>
              <button
                onClick={() => setActiveTab("hq")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === "hq" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                HQ ({hqWarehouses.length})
              </button>
              <button
                onClick={() => setActiveTab("warehouses")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === "warehouses" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                Depots ({regionalWarehouses.length})
              </button>
              <button
                onClick={() => setActiveTab("sellers")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === "sellers" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                Sellers ({sellerWarehouses.length})
              </button>
            </div>
          </div>
        </div>

        {/* Location Table */}
        {displayedLocations.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-500">
              <Package className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-800">No matching locations found</h4>
            <p className="mt-1 text-xs text-zinc-600">
              Try adjusting your search query or filter tab.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-160 text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  <th className="py-3 px-3">Location & Tier</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Operating Role</th>
                  <th className="py-3 px-3 text-right">Stock Share</th>
                  <th className="py-3 px-3 text-right">Available Packets</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {displayedLocations.map((loc) => {
                  const share =
                    totalStock > 0 ? ((loc.balance / totalStock) * 100).toFixed(1) : "0.0";
                  const isHQ = loc.type === "HQ";
                  const isWarehouse = loc.type === "WAREHOUSE";
                  const isSeller = loc.type === "SELLER";

                  return (
                    <tr key={loc.id} className="hover:bg-[#FFFDFD] transition group">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              isHQ
                                ? "bg-emerald-50 text-[#156035]"
                                : isWarehouse
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-[#E61C5D]"
                            }`}
                          >
                            {isHQ ? (
                              <WarehouseIcon className="h-4 w-4" />
                            ) : isWarehouse ? (
                              <Building2 className="h-4 w-4" />
                            ) : (
                              <Store className="h-4 w-4" />
                            )}
                          </span>
                          <div>
                            <span className="font-bold text-zinc-950 block">{loc.name}</span>
                            <span className="text-[11px] text-zinc-600 font-medium">
                              ID: {loc.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isHQ
                              ? "bg-emerald-50 text-[#156035]"
                              : isWarehouse
                              ? "bg-amber-50 text-amber-800"
                              : "bg-rose-50 text-rose-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isHQ
                                ? "bg-[#156035]"
                                : isWarehouse
                                ? "bg-amber-600"
                                : "bg-[#E61C5D]"
                            }`}
                          />
                          {isHQ
                            ? "Central Headquarters"
                            : isWarehouse
                            ? "Regional Depot"
                            : "Field Seller"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-medium text-zinc-700">
                        {isHQ
                          ? "Primary Central Reserve"
                          : isWarehouse
                          ? "Regional Buffer Distribution"
                          : "Direct Field Retail / Sales"}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-800">{share}%</span>
                          <div className="h-1.5 w-16 bg-zinc-100 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                isHQ
                                  ? "bg-[#156035]"
                                  : isWarehouse
                                  ? "bg-amber-500"
                                  : "bg-[#E61C5D]"
                              }`}
                              style={{ width: `${Math.min(parseFloat(share), 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`text-sm font-extrabold ${
                            isHQ
                              ? "text-[#156035]"
                              : isWarehouse
                              ? "text-amber-800"
                              : "text-rose-700"
                          }`}
                        >
                          {loc.balance.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-600 ml-1">pkts</span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <Link
                          href={`/admin/inventory/transfers?source=${loc.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-800 hover:border-rose-200 hover:text-[#E61C5D] hover:bg-rose-50/50 transition"
                        >
                          Transfer <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. STOCK MOVEMENT HISTORY & AUDIT LOG (ON WHICH DATE IT GOES WHERE) */}
      <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                <History className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-playfair text-lg font-bold text-zinc-950">
                  Stock Transfer & Movement History
                </h3>
                <p className="text-xs text-zinc-600">
                  Full chronological audit log: On which date, from where, and to where stock moved
                </p>
              </div>
            </div>
          </div>

          {/* Filters for transactions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search origin, destination, actor..."
                className="h-10 w-full sm:w-64 rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-9 pr-3 text-xs font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-[#FAF8F5] px-2.5 py-1">
              <Filter className="h-3.5 w-3.5 text-zinc-500" />
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Event Types</option>
                <option value="RECEIPT">HQ Stock Inward</option>
                <option value="TRANSFER">Internal Transfers</option>
                <option value="SALE">Direct Customer Sales</option>
                
              </select>
            </div>
          </div>
        </div>

        {/* History List / Table */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-500">
              <History className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-800">No stock movements recorded</h4>
            <p className="mt-1 text-xs text-zinc-600">
              When stock is inwarded, transferred between depots, or sold to customers, the audit trail will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-180 text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  <th className="py-3 px-3">Date & Timestamp</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3">Origin (From)</th>
                  <th className="py-3 px-3">Route</th>
                  <th className="py-3 px-3">Destination (To)</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredTransactions.map((tx) => {
                  const dateObj = new Date(tx.createdAt);
                  const formattedDate = dateObj.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isInward = tx.type === "RECEIPT";
                  const isTransfer = tx.type === "TRANSFER";
                  const isSale = tx.type === "SALE";
                  const isDamage = (tx.type as string) === "DAMAGE";

                  return (
                    <tr key={tx.id} className="hover:bg-[#FFFDFD] transition">
                      {/* Date & Time */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                            <Calendar className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <span className="font-bold text-zinc-950 block">{formattedDate}</span>
                            <span className="text-[11px] text-zinc-600 flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3" /> {formattedTime}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isInward
                              ? "bg-emerald-50 text-[#156035]"
                              : isTransfer
                              ? "bg-sky-50 text-sky-800"
                              : isSale
                              ? "bg-purple-50 text-purple-800"
                              : "bg-rose-50 text-rose-800"
                          }`}
                        >
                          {isInward ? (
                            <PackagePlus className="h-3 w-3" />
                          ) : isTransfer ? (
                            <ArrowRightLeft className="h-3 w-3" />
                          ) : isSale ? (
                            <PackageCheck className="h-3 w-3" />
                          ) : (
                            <PackageMinus className="h-3 w-3" />
                          )}
                          {tx.type}
                        </span>
                      </td>

                      {/* Origin Source */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-zinc-950">
                          {tx.source?.name || (isInward ? "Factory / Manufacturing" : "Central HQ")}
                        </div>
                        <div className="text-[11px] text-zinc-600 font-medium">
                          {tx.source?.type || (isInward ? "Manufacturer" : "HQ Reserve")}
                        </div>
                      </td>

                      {/* Route Arrow Indicator */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-zinc-950">
                          {tx.destination?.name || (isSale ? "Customer Retail Store" : "Headquarters Reserve")}
                        </div>
                        <div className="text-[11px] text-zinc-600 font-medium">
                          {tx.destination?.type || (isSale ? "End Customer" : "HQ")}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="text-sm font-extrabold text-zinc-950">
                          +{tx.quantity.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-600 ml-1">pkts</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#156035]">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  <h3 className="font-playfair text-lg font-bold text-zinc-950">Stock Receipt / Inward</h3>
                  <p className="text-xs text-zinc-600">Record newly manufactured packets received at HQ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition"
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
                <label className="block text-xs font-bold text-zinc-800">
                  Packets Received at HQ *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={inwardQty}
                  onChange={(e) =>
                    setInwardQty(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="e.g. 500"
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
                <p className="mt-1 text-[11px] text-zinc-600">
                  Packets are incremented into the central Headquarters (HQ) reserve.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition"
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
                  <h3 className="font-playfair text-lg font-bold text-zinc-950">
                    Add Regional Warehouse
                  </h3>
                  <p className="text-xs text-zinc-600">Create a regional depot for buffer packet storage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWarehouseModal(false)}
                className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition"
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
                <label className="block text-xs font-bold text-zinc-800">
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
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-50 transition"
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
