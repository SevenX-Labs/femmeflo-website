"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Boxes,
  Building2,
  Edit3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
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
  const ledgerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<InventorySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize] = useState(15);
  const [txTotalCount, setTxTotalCount] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Filter tabs for locations & warehouses
  const [activeTab, setActiveTab] = useState<"all" | "hq" | "warehouses" | "sellers" | "zero">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // History filtering
  const [historyFilterType, setHistoryFilterType] = useState<string>("ALL");
  const [historySearch, setHistorySearch] = useState("");

  // Adjust / Edit Available Stock modal state
  const [editingLocation, setEditingLocation] = useState<WarehouseItem | null>(null);
  const [editStockValue, setEditStockValue] = useState<number | string>("");
  const [editStockReason, setEditStockReason] = useState("");
  const [isEditStockSubmitting, setIsEditStockSubmitting] = useState(false);
  const [editStockError, setEditStockError] = useState<string | null>(null);
  const [editStockNotice, setEditStockNotice] = useState<string | null>(null);

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

  // Copied transaction ID indicator
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setError(null);
      const invRes = await adminApi.getInventorySummary();
      setData(invRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to reach server";
      setError(msg);
    }
  };

  const fetchTransactions = async (pageToFetch = txPage, typeFilter = historyFilterType) => {
    setTxLoading(true);
    setTxError(null);
    try {
      const typeParam = typeFilter === "ALL" ? undefined : typeFilter;
      const txRes = await adminApi.listTransactions({
        page: pageToFetch,
        pageSize: txPageSize,
        type: typeParam,
      });
      const list = txRes?.transactions ?? txRes?.items ?? [];
      setTransactions(list);
      setTxTotalCount(txRes?.pagination?.total ?? list.length);
      setTxTotalPages(txRes?.pagination?.totalPages ?? 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load stock movements";
      setTxError(msg);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchTransactions(1, historyFilterType)]);
    setTxPage(1);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUpdateStockBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    const num = Number(editStockValue);
    if (isNaN(num) || num < 0) {
      setEditStockError("Please enter a valid stock balance (0 or greater).");
      return;
    }

    setIsEditStockSubmitting(true);
    setEditStockError(null);
    setEditStockNotice(null);

    try {
      await adminApi.updateLocationBalance(editingLocation.id, {
        balance: num,
        reason: editStockReason.trim() || undefined,
      });

      setEditStockNotice(`Stock balance updated to ${num.toLocaleString("en-IN")} packets.`);
      await fetchSummary();
      await fetchTransactions(1, historyFilterType === "ALL" ? undefined : historyFilterType);

      setTimeout(() => {
        setEditingLocation(null);
        setEditStockNotice(null);
        setEditStockError(null);
        setEditStockReason("");
      }, 1000);
    } catch (err: any) {
      setEditStockError(err.message || "Failed to update stock balance.");
    } finally {
      setIsEditStockSubmitting(false);
    }
  };

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

  const zeroStockLocations = useMemo(() => {
    return allLocations.filter((l) => l.balance <= 0);
  }, [allLocations]);

  // Filtered warehouses/locations based on tab & search
  const displayedLocations = useMemo(() => {
    let list: WarehouseItem[] = [];
    if (activeTab === "all") list = allLocations;
    else if (activeTab === "hq") list = hqWarehouses;
    else if (activeTab === "warehouses") list = regionalWarehouses;
    else if (activeTab === "sellers") list = sellerWarehouses;
    else if (activeTab === "zero") list = zeroStockLocations;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      (item.seller?.name && item.seller.name.toLowerCase().includes(q))
    );
  }, [activeTab, allLocations, hqWarehouses, regionalWarehouses, sellerWarehouses, zeroStockLocations, searchQuery]);

  // Filtered transactions (client search over current page)
  const displayedTransactions = useMemo(() => {
    if (!historySearch.trim()) return transactions;
    const q = historySearch.toLowerCase();
    return transactions.filter((tx) => {
      const sName = tx.source?.name?.toLowerCase() || "";
      const dName = tx.destination?.name?.toLowerCase() || "";
      const actor = tx.actor?.name?.toLowerCase() || "";
      const cust = tx.sale?.customer?.shopName?.toLowerCase() || "";
      const id = tx.id.toLowerCase();
      return sName.includes(q) || dName.includes(q) || actor.includes(q) || cust.includes(q) || id.includes(q);
    });
  }, [transactions, historySearch]);

  // Authoritative Stock Quantities
  const totalReceived = data?.totalReceived ?? 0;
  const totalTransferred = data?.totalTransferred ?? 0;
  const totalSold = data?.totalSold ?? 0;

  const hqStock = data?.hqStock ?? 0;
  const whStock = data?.warehouseStock ?? 0;
  const slStock = data?.sellerStock ?? 0;
  const totalStock = data?.totalInventory ?? (hqStock + whStock + slStock);

  // Percentage distribution calculations (Only valid when denominator > 0)
  const hqPercent = totalStock > 0 ? Math.round((hqStock / totalStock) * 100) : 0;
  const whPercent = totalStock > 0 ? Math.round((whStock / totalStock) * 100) : 0;
  const slPercent = totalStock > 0 ? Math.round((slStock / totalStock) * 100) : 0;
  const remainingPercent = totalReceived > 0 ? ((totalStock / totalReceived) * 100).toFixed(1) : null;

  // Traceable Navigation Helpers
  const scrollToLedger = (tab: "all" | "hq" | "warehouses" | "sellers" | "zero") => {
    setActiveTab(tab);
    if (ledgerRef.current) {
      ledgerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToHistory = (type: string) => {
    setHistoryFilterType(type);
    fetchTransactions(1, type);
    setTxPage(1);
    if (historyRef.current) {
      historyRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCopyTxId = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedTxId(id);
      setTimeout(() => setCopiedTxId(null), 2000);
    }
  };

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
              disabled={loading || txLoading}
              title="Refresh live inventory data"
              className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xs transition hover:border-rose-200 hover:text-[#E61C5D] active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading || txLoading ? "animate-spin text-[#E61C5D]" : ""}`} />
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
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Unable to sync live inventory counts: {error}</span>
          </div>
          <button
            onClick={fetchAllData}
            className="underline hover:text-amber-950 font-bold ml-4 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State Banner when all primary stock counts are 0 */}
      {!loading && totalReceived === 0 && totalStock === 0 && totalSold === 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 px-4 py-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[#156035]">
              <PackagePlus className="h-4 w-4" />
            </span>
            <div>
              <p className="font-bold text-zinc-900">
                No stock received yet. Add your first supplier receipt to activate inventory tracking.
              </p>
              <p className="text-[11px] text-zinc-500">
                Inward intake will establish your central warehouse balance and custody chain.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowInwardModal(true);
              setInwardError("");
              setInwardNotice("");
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#156035] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition cursor-pointer"
          >
            <PackagePlus className="h-3.5 w-3.5" />
            <span>+ Stock Inward</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. PRIMARY STOCK METRICS CARDS (CARDS 1 - 4) */}
      {/* ======================================================== */}
      <div className="mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100/80 text-[#156035]">
              <Package className="h-3 w-3" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-900">
                Primary Inventory Ledger Position
              </h2>
              <span className="hidden sm:inline-block text-[11px] text-zinc-400">•</span>
              <p className="hidden sm:inline-block text-[11px] text-zinc-500">Live authoritative stock metrics & balance flow</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-zinc-600 bg-white px-3 py-1 rounded-full border border-zinc-200/80 shadow-xs self-start sm:self-auto">
            <span className="inline-flex items-center gap-1 text-[#156035] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#156035]" /> Inward Intake
            </span>
            <span className="text-zinc-300">−</span>
            <span className="inline-flex items-center gap-1 text-[#E61C5D] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E61C5D]" /> Confirmed Sales
            </span>
            <span className="text-zinc-300">=</span>
            <span className="inline-flex items-center gap-1 text-zinc-900 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available Stock
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl border border-zinc-200 bg-white p-3.5 animate-pulse flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-zinc-200 rounded" />
                  <div className="h-4 w-4 bg-zinc-200 rounded" />
                </div>
                <div className="h-7 w-28 bg-zinc-200 rounded" />
                <div className="h-2.5 w-36 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* CARD 1 — Total Stock Received */}
            <div
              onClick={() => scrollToHistory("RECEIPT")}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === "Enter" && scrollToHistory("RECEIPT")}
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-xs transition-all duration-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#156035]"
              title="Click to view inward receipt history"
            >
              {/* Row 1: Label + Icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Total Received
                </span>
                <PackagePlus className="h-4 w-4 text-[#156035] group-hover:scale-110 transition-transform shrink-0" />
              </div>

              {/* Row 2: Big Number + Unit */}
              <div className="my-1.5 flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-extrabold tracking-tight ${totalReceived === 0 ? "text-zinc-400" : "text-zinc-950"}`}>
                    {totalReceived.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">packets</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-0.5 group-hover:underline">
                  Receipts <ArrowRight className="h-3 w-3 inline group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Row 3: Helper Line */}
              <p className="truncate text-[11px] text-zinc-500" title="Cumulative verified intake through official supplier receipts">
                Cumulative verified intake from suppliers
              </p>
            </div>

            {/* CARD 2 — Available Stock (HERO) */}
            <div
              onClick={() => scrollToLedger("all")}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === "Enter" && scrollToLedger("all")}
              className="group relative flex flex-col justify-between rounded-xl border border-[#156035] bg-[#156035] text-white p-3.5 shadow-xs transition-all duration-200 hover:bg-[#0f4e2b] hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
              title="Click to inspect all location balances"
            >
              {/* Row 1: Label + Retained Badge + Icon */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                    Available Stock
                  </span>
                  {remainingPercent && (
                    <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-100">
                      {remainingPercent}%
                    </span>
                  )}
                </div>
                <Boxes className="h-4 w-4 text-emerald-200 group-hover:scale-110 transition-transform shrink-0" />
              </div>

              {/* Row 2: Big Number + Unit */}
              <div className="my-1.5 flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-extrabold tracking-tight ${totalStock === 0 ? "text-emerald-200/70" : "text-white"}`}>
                    {totalStock.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-semibold text-emerald-200">packets</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-100 flex items-center gap-0.5 group-hover:underline">
                  Ledger <ArrowRight className="h-3 w-3 inline group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Row 3: Helper Line */}
              <p className="truncate text-[11px] text-emerald-100/90" title="Current physical stock held across HQ, regional depots & sellers">
                Active physical stock across network
              </p>
            </div>

            {/* CARD 3 — Stock Transferred */}
            <div
              onClick={() => scrollToHistory("TRANSFER")}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === "Enter" && scrollToHistory("TRANSFER")}
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-xs transition-all duration-200 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
              title="Click to view internal transfers"
            >
              {/* Row 1: Label + Icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Stock Transferred
                </span>
                <ArrowRightLeft className="h-4 w-4 text-sky-600 group-hover:scale-110 transition-transform shrink-0" />
              </div>

              {/* Row 2: Big Number + Unit */}
              <div className="my-1.5 flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-extrabold tracking-tight ${totalTransferred === 0 ? "text-zinc-400" : "text-zinc-950"}`}>
                    {totalTransferred.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">packets</span>
                </div>
                <span className="text-[11px] font-semibold text-sky-700 flex items-center gap-0.5 group-hover:underline">
                  Dispatches <ArrowRight className="h-3 w-3 inline group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Row 3: Helper Line */}
              <p className="truncate text-[11px] text-zinc-500" title="Cumulative internal dispatches between HQ, depots & field sellers">
                Dispatches between HQ, depots & sellers
              </p>
            </div>

            {/* CARD 4 — Total Packets Sold */}
            <Link
              href="/admin/sales"
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-xs transition-all duration-200 hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#E61C5D]"
              title="Open confirmed sales records"
            >
              {/* Row 1: Label + Icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Total Sold
                </span>
                <PackageCheck className="h-4 w-4 text-[#E61C5D] group-hover:scale-110 transition-transform shrink-0" />
              </div>

              {/* Row 2: Big Number + Unit */}
              <div className="my-1.5 flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-extrabold tracking-tight ${totalSold === 0 ? "text-zinc-400" : "text-zinc-950"}`}>
                    {totalSold.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">packets</span>
                </div>
                <span className="text-[11px] font-semibold text-[#E61C5D] flex items-center gap-0.5 group-hover:underline">
                  Sales <ExternalLink className="h-3 w-3 inline group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Row 3: Helper Line */}
              <p className="truncate text-[11px] text-zinc-500" title="Deducted strictly through verified & confirmed retail customer sales">
                Verified customer retail deductions
              </p>
            </Link>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. OPERATIONAL DISTRIBUTION BREAKDOWN (CARDS 5 - 8) */}
      {/* ======================================================== */}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100/80 text-amber-800">
              <Building2 className="h-3 w-3" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-900">
                Current Tier-Wise Custody & Allocation
              </h2>
              <span className="hidden sm:inline-block text-[11px] text-zinc-400">•</span>
              <p className="hidden sm:inline-block text-[11px] text-zinc-500">Physical custody breakdown across storage tiers (click any tier to filter ledger)</p>
            </div>
          </div>
          
          {activeTab !== "all" && (
            <button
              type="button"
              onClick={() => scrollToLedger("all")}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-900 hover:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs transition cursor-pointer"
            >
              <span>Filter Active</span>
              <span className="text-zinc-400 font-normal">|</span>
              <span className="text-emerald-300">Reset</span>
              <X className="h-3 w-3 ml-0.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-zinc-200 bg-white p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 p-3 animate-pulse flex flex-col justify-between">
                <div className="h-3 w-24 bg-zinc-200 rounded" />
                <div className="h-7 w-28 bg-zinc-200 rounded" />
                <div className="h-2.5 w-32 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-zinc-200/90 bg-white divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 shadow-xs overflow-hidden">
            {/* SEGMENT 1 — HQ Central */}
            {(() => {
              const isSelected = activeTab === "hq";
              return (
                <div
                  onClick={() => scrollToLedger(isSelected ? "all" : "hq")}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => e.key === "Enter" && scrollToLedger(isSelected ? "all" : "hq")}
                  className={`group flex flex-col justify-between p-3.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#156035] ${
                    isSelected
                      ? "bg-emerald-50/70"
                      : "hover:bg-zinc-50/80"
                  }`}
                  title="Click to filter ledger by HQ Central"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      HQ Central Reserve
                    </span>
                    <WarehouseIcon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isSelected ? "text-[#156035]" : "text-zinc-400"}`} />
                  </div>

                  <div className="my-1.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-extrabold tracking-tight ${hqStock === 0 ? "text-zinc-400" : isSelected ? "text-[#156035]" : "text-zinc-950"}`}>
                        {hqStock.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">packets</span>
                    </div>
                    {totalStock > 0 && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-[#156035]">
                        {hqPercent}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 truncate">Central intake warehouse</span>
                    {isSelected && <span className="font-bold text-[#156035] text-[10px]">Filter active ✓</span>}
                  </div>
                </div>
              );
            })()}

            {/* SEGMENT 2 — Regional Depots */}
            {(() => {
              const isSelected = activeTab === "warehouses";
              return (
                <div
                  onClick={() => scrollToLedger(isSelected ? "all" : "warehouses")}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => e.key === "Enter" && scrollToLedger(isSelected ? "all" : "warehouses")}
                  className={`group flex flex-col justify-between p-3.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isSelected
                      ? "bg-amber-50/70"
                      : "hover:bg-zinc-50/80"
                  }`}
                  title="Click to filter ledger by Regional Depots"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Regional Depots
                    </span>
                    <Building2 className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isSelected ? "text-amber-700" : "text-zinc-400"}`} />
                  </div>

                  <div className="my-1.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-extrabold tracking-tight ${whStock === 0 ? "text-zinc-400" : isSelected ? "text-amber-800" : "text-zinc-950"}`}>
                        {whStock.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">packets</span>
                    </div>
                    {totalStock > 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
                        {whPercent}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 truncate">{regionalWarehouses.length} active depot{regionalWarehouses.length === 1 ? "" : "s"}</span>
                    {isSelected && <span className="font-bold text-amber-800 text-[10px]">Filter active ✓</span>}
                  </div>
                </div>
              );
            })()}

            {/* SEGMENT 3 — Field Officers */}
            {(() => {
              const isSelected = activeTab === "sellers";
              return (
                <div
                  onClick={() => scrollToLedger(isSelected ? "all" : "sellers")}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => e.key === "Enter" && scrollToLedger(isSelected ? "all" : "sellers")}
                  className={`group flex flex-col justify-between p-3.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E61C5D] ${
                    isSelected
                      ? "bg-rose-50/70"
                      : "hover:bg-zinc-50/80"
                  }`}
                  title="Click to filter ledger by Field Officers"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Field Officers
                    </span>
                    <Store className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isSelected ? "text-[#E61C5D]" : "text-zinc-400"}`} />
                  </div>

                  <div className="my-1.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-extrabold tracking-tight ${slStock === 0 ? "text-zinc-400" : isSelected ? "text-[#E61C5D]" : "text-zinc-950"}`}>
                        {slStock.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">packets</span>
                    </div>
                    {totalStock > 0 && (
                      <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[9px] font-bold text-[#E61C5D]">
                        {slPercent}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 truncate">{sellerWarehouses.length} field officer{sellerWarehouses.length === 1 ? "" : "s"}</span>
                    {isSelected && <span className="font-bold text-[#E61C5D] text-[10px]">Filter active ✓</span>}
                  </div>
                </div>
              );
            })()}

            {/* SEGMENT 4 — Zero Stock Locations */}
            {(() => {
              const isSelected = activeTab === "zero";
              const count = zeroStockLocations.length;
              const hasZeroWarning = count > 0;
              return (
                <div
                  onClick={() => scrollToLedger(isSelected ? "all" : "zero")}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => e.key === "Enter" && scrollToLedger(isSelected ? "all" : "zero")}
                  className={`group flex flex-col justify-between p-3.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-800 ${
                    isSelected
                      ? "bg-zinc-100/90"
                      : "hover:bg-zinc-50/80"
                  }`}
                  title="Click to filter zero-stock locations"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Zero Stock Locations
                    </span>
                    <PackageMinus className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${hasZeroWarning ? "text-amber-600" : "text-zinc-400"}`} />
                  </div>

                  <div className="my-1.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-extrabold tracking-tight ${hasZeroWarning ? "text-amber-600" : "text-zinc-400"}`}>
                        {count}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">
                        {count === 1 ? "location" : "locations"}
                      </span>
                    </div>
                    {hasZeroWarning && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                        Needs stock
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 truncate">
                      {hasZeroWarning ? "Depots or sellers with 0 packets" : "All locations have active stock"}
                    </span>
                    {isSelected && <span className="font-bold text-zinc-900 text-[10px]">Filter active ✓</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>


      {/* ======================================================== */}
      {/* 3. STOCK DISTRIBUTION PIPELINE */}
      {/* ======================================================== */}
      <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#E61C5D]" /> Stock Distribution Pipeline
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              Proportional distribution of current physical stock across operational custody tiers
            </p>
          </div>
          {totalStock > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#156035] px-2.5 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-[#156035]" /> HQ Reserve ({hqPercent}%)
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Regional Depots ({whPercent}%)
              </span>
              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 px-2.5 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-[#E61C5D]" /> Field Officers ({slPercent}%)
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-6 space-y-3 animate-pulse">
            <div className="h-4 w-full bg-zinc-200 rounded-full" />
            <div className="h-3 w-48 bg-zinc-100 rounded" />
          </div>
        ) : totalStock === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <Layers className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-900">No stock available in the system yet</h4>
            <p className="mt-1 text-xs text-zinc-600 max-w-md mx-auto">
              All inventory tiers currently show zero balance. Stock distribution ratios will activate automatically once packets are inwarded into HQ Central Reserve.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowInwardModal(true);
                  setInwardError("");
                  setInwardNotice("");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition"
              >
                <PackagePlus className="h-4 w-4" />
                <span>Perform Stock Inward</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            {/* Multi-segment distribution progress bar */}
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 p-0.5 shadow-inner">
              {hqStock > 0 && (
                <div
                  style={{ width: `${hqPercent}%` }}
                  title={`HQ Central Reserve: ${hqStock.toLocaleString("en-IN")} pkts (${hqPercent}%)`}
                  className="h-full bg-[#156035] first:rounded-l-full last:rounded-r-full transition-all duration-500"
                />
              )}
              {whStock > 0 && (
                <div
                  style={{ width: `${whPercent}%` }}
                  title={`Regional Depots: ${whStock.toLocaleString("en-IN")} pkts (${whPercent}%)`}
                  className="h-full bg-amber-500 first:rounded-l-full last:rounded-r-full transition-all duration-500"
                />
              )}
              {slStock > 0 && (
                <div
                  style={{ width: `${slPercent}%` }}
                  title={`Field Officers: ${slStock.toLocaleString("en-IN")} pkts (${slPercent}%)`}
                  className="h-full bg-[#E61C5D] first:rounded-l-full last:rounded-r-full transition-all duration-500"
                />
              )}
            </div>

            {/* Pipeline Detail Cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-zinc-100 bg-[#FAF8F5] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                    1. Central Reserve (HQ)
                  </span>
                  <span className="text-sm font-extrabold text-zinc-950 block mt-0.5">
                    {hqStock.toLocaleString("en-IN")} pkts
                  </span>
                </div>
                <span className="text-xs font-bold text-[#156035] bg-emerald-50 px-2 py-1 rounded-lg">
                  {hqPercent}%
                </span>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-[#FAF8F5] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                    2. Regional Depots ({regionalWarehouses.length})
                  </span>
                  <span className="text-sm font-extrabold text-zinc-950 block mt-0.5">
                    {whStock.toLocaleString("en-IN")} pkts
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
                  {whPercent}%
                </span>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-[#FAF8F5] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                    3. Field Officers ({sellerWarehouses.length})
                  </span>
                  <span className="text-sm font-extrabold text-zinc-950 block mt-0.5">
                    {slStock.toLocaleString("en-IN")} pkts
                  </span>
                </div>
                <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded-lg">
                  {slPercent}%
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-zinc-500 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>
                Transfers between tiers reallocate existing stock location without altering total system inventory. Total physical inventory = {totalStock.toLocaleString("en-IN")} pkts.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. WAREHOUSES & LOCATIONS STOCK LEDGER */}
      {/* ======================================================== */}
      <div ref={ledgerRef} className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <h3 className="font-playfair text-lg font-bold text-zinc-950">
              Warehouse & Location Stock Ledger
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              Current available packet balance, cumulative inward/received, transferred out, and last movement per location
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search location */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search warehouse or officer..."
                className="h-10 w-full sm:w-56 rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-9 pr-8 text-xs font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
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
            <div className="flex flex-wrap items-center rounded-xl bg-zinc-100 p-1 text-xs font-bold text-zinc-700">
              <button
                onClick={() => setActiveTab("all")}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  activeTab === "all" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                All ({allLocations.length})
              </button>
              <button
                onClick={() => setActiveTab("hq")}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  activeTab === "hq" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                HQ ({hqWarehouses.length})
              </button>
              <button
                onClick={() => setActiveTab("warehouses")}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  activeTab === "warehouses" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                Depots ({regionalWarehouses.length})
              </button>
              <button
                onClick={() => setActiveTab("sellers")}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  activeTab === "sellers" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                Officers ({sellerWarehouses.length})
              </button>
              <button
                onClick={() => setActiveTab("zero")}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  activeTab === "zero" ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                }`}
              >
                Zero Stock ({zeroStockLocations.length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 w-full bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayedLocations.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
              <Package className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-800">No matching locations found</h4>
            <p className="mt-1 text-xs text-zinc-500">
              {searchQuery ? "No location matches your search query." : "No locations registered in this category."}
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE LOCATION CARDS (under 768px) */}
            <div className="md:hidden mt-4 space-y-3">
              {displayedLocations.map((loc) => {
                const share =
                  totalStock > 0 ? ((loc.balance / totalStock) * 100).toFixed(1) : "0.0";
                const isHQ = loc.type === "HQ";
                const isWarehouse = loc.type === "WAREHOUSE";

                const lastMoveText = loc.lastMovementAt
                  ? new Date(loc.lastMovementAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "No movements";

                return (
                  <div
                    key={`m-${loc.id}`}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isHQ
                              ? "bg-emerald-50 text-[#156035]"
                              : isWarehouse
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-[#E61C5D]"
                          }`}
                        >
                          {isHQ ? (
                            <WarehouseIcon className="h-4.5 w-4.5" />
                          ) : isWarehouse ? (
                            <Building2 className="h-4.5 w-4.5" />
                          ) : (
                            <Store className="h-4.5 w-4.5" />
                          )}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-950">{loc.name}</h4>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                              isHQ
                                ? "bg-emerald-50 text-[#156035]"
                                : isWarehouse
                                ? "bg-amber-50 text-amber-800"
                                : "bg-rose-50 text-rose-800"
                            }`}
                          >
                            {isHQ
                              ? "HQ Reserve"
                              : isWarehouse
                              ? "Regional Depot"
                              : "Field Officer"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-base font-extrabold block ${
                            isHQ
                              ? "text-[#156035]"
                              : isWarehouse
                              ? "text-amber-800"
                              : "text-rose-700"
                          }`}
                        >
                          {loc.balance.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">pkts ({share}%)</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2 text-center text-[11px]">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase">Received</span>
                        <span className="font-bold text-zinc-800">
                          {(loc.received ?? 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase">Dispatched</span>
                        <span className="font-bold text-zinc-800">
                          {(loc.transferredOut ?? 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase">
                          {loc.type === "SELLER" ? "Sold" : "Last Act"}
                        </span>
                        <span className="font-bold text-zinc-800">
                          {loc.type === "SELLER" ? (loc.sold ?? 0).toLocaleString("en-IN") : lastMoveText}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Last movement: {lastMoveText}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLocation(loc);
                            setEditStockValue(loc.balance);
                            setEditStockReason("");
                            setEditStockError(null);
                            setEditStockNotice(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit Stock</span>
                        </button>
                        <Link
                          href={`/admin/inventory/transfers?source=${loc.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-800 hover:text-[#E61C5D] hover:border-rose-200"
                        >
                          Transfer <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (768px and up) */}
            <div className="hidden md:block mt-4 overflow-x-auto">
              <table className="w-full min-w-200 text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-3">Location & ID</th>
                    <th className="py-3 px-3">Operating Role</th>
                    <th className="py-3 px-3 text-right">Available Stock</th>
                    <th className="py-3 px-3 text-right">Stock Received</th>
                    <th className="py-3 px-3 text-right">Transferred Out</th>
                    <th className="py-3 px-3 text-right">Sold to Customer</th>
                    <th className="py-3 px-3 text-center">Last Movement</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {displayedLocations.map((loc) => {
                    const share =
                      totalStock > 0 ? ((loc.balance / totalStock) * 100).toFixed(1) : "0.0";
                    const isHQ = loc.type === "HQ";
                    const isWarehouse = loc.type === "WAREHOUSE";

                    const lastMoveFormatted = loc.lastMovementAt
                      ? new Date(loc.lastMovementAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";

                    return (
                      <tr key={loc.id} className="hover:bg-[#FFFDFD] transition group">
                        {/* Location Name & ID */}
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
                              <span className="text-[11px] text-zinc-500 font-medium">
                                ID: {loc.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category / Tier */}
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
                              ? "Central HQ"
                              : isWarehouse
                              ? "Regional Depot"
                              : "Field Officer"}
                          </span>
                        </td>

                        {/* Available Stock */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
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
                            <span className="text-[11px] font-medium text-zinc-500">pkts</span>
                          </div>
                          <span className="block text-[10px] text-zinc-400 font-medium">
                            {share}% of system
                          </span>
                        </td>

                        {/* Received */}
                        <td className="py-3.5 px-3 text-right font-semibold text-zinc-800">
                          {(loc.received ?? 0).toLocaleString("en-IN")} pkts
                        </td>

                        {/* Transferred Out */}
                        <td className="py-3.5 px-3 text-right font-semibold text-zinc-800">
                          {(loc.transferredOut ?? 0).toLocaleString("en-IN")} pkts
                        </td>

                        {/* Sold */}
                        <td className="py-3.5 px-3 text-right">
                          {loc.type === "SELLER" ? (
                            <span className="font-bold text-purple-700">
                              {(loc.sold ?? 0).toLocaleString("en-IN")} pkts
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-medium">—</span>
                          )}
                        </td>

                        {/* Last Movement */}
                        <td className="py-3.5 px-3 text-center text-zinc-600 font-medium text-[11px]">
                          {lastMoveFormatted}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLocation(loc);
                                setEditStockValue(loc.balance);
                                setEditStockReason("");
                                setEditStockError(null);
                                setEditStockNotice(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 hover:border-amber-300 transition cursor-pointer shadow-2xs"
                              title="Edit available stock balance for this location"
                            >
                              <Edit3 className="h-3 w-3 text-amber-700" />
                              <span>Edit Stock</span>
                            </button>
                            <Link
                              href={`/admin/inventory/transfers?source=${loc.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-bold text-zinc-800 hover:border-rose-200 hover:text-[#E61C5D] hover:bg-rose-50/50 transition"
                            >
                              Transfer <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. STOCK MOVEMENT HISTORY & AUDIT LOG */}
      {/* ======================================================== */}
      <div ref={historyRef} className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                <History className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-playfair text-lg font-bold text-zinc-950">
                  Stock Transfer & Movement History
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Full chronological audit log of all stock inward, internal transfers, and confirmed customer sale deductions
                </p>
              </div>
            </div>
          </div>

          {/* Filters for transactions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search origin, destination, actor..."
                className="h-10 w-full sm:w-64 rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-9 pr-8 text-xs font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
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
              <Filter className="h-3.5 w-3.5 text-zinc-400" />
              <select
                value={historyFilterType}
                onChange={(e) => {
                  const val = e.target.value;
                  setHistoryFilterType(val);
                  setTxPage(1);
                  fetchTransactions(1, val);
                }}
                className="bg-transparent text-xs font-bold text-zinc-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Event Types</option>
                <option value="RECEIPT">HQ Stock Inward</option>
                <option value="TRANSFER">Internal Transfers</option>
                <option value="SALE">Confirmed Customer Sales</option>
              </select>
            </div>
          </div>
        </div>

        {/* Movement Table / Empty States */}
        {txLoading ? (
          <div className="py-12 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 w-full bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : txError ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-800">Unable to load stock history</h4>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">{txError}</p>
            <button
              onClick={() => fetchTransactions(txPage, historyFilterType)}
              className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition shadow-xs"
            >
              Retry Loading Movements
            </button>
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
              <History className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-800">No stock movements yet</h4>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Stock history will appear here after the first stock inward, transfer, or confirmed sale.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowInwardModal(true);
                  setInwardError("");
                  setInwardNotice("");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition"
              >
                <PackagePlus className="h-4 w-4" />
                <span>Perform Stock Inward</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* MOBILE HISTORY CARDS (under 768px) */}
            <div className="md:hidden mt-4 space-y-3">
              {displayedTransactions.map((tx) => {
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

                const originName = tx.source?.name || (isInward ? "Supplier / Inward" : "Central HQ");
                const destName =
                  tx.destination?.name ||
                  (isSale
                    ? tx.sale?.customer?.shopName
                      ? `Sale: ${tx.sale.customer.shopName}`
                      : "Customer Sale Order"
                    : "Central HQ");

                return (
                  <div
                    key={`m-tx-${tx.id}`}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                        ) : (
                          <PackageCheck className="h-3 w-3" />
                        )}
                        {isInward ? "Stock Inward" : isTransfer ? "Stock Transfer" : "Confirmed Sale"}
                      </span>

                      <span className="text-sm font-extrabold text-zinc-950">
                        {tx.quantity.toLocaleString("en-IN")} pkts
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 pt-2.5">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">
                          From (Origin)
                        </span>
                        <span className="font-semibold text-zinc-900 block truncate mt-0.5">
                          {originName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">
                          To (Destination)
                        </span>
                        <span className="font-semibold text-zinc-900 block truncate mt-0.5">
                          {destName}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{formattedDate} · {formattedTime}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#156035]">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (768px and up) */}
            <div className="hidden md:block mt-4 overflow-x-auto">
              <table className="w-full min-w-220 text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-3">Date & Timestamp</th>
                    <th className="py-3 px-3">Reference ID</th>
                    <th className="py-3 px-3">Movement Type</th>
                    <th className="py-3 px-3">Origin (From)</th>
                    <th className="py-3 px-3 text-center">Flow</th>
                    <th className="py-3 px-3">Destination (To)</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-3">Authorized By</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {displayedTransactions.map((tx) => {
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

                    const originName = tx.source?.name || (isInward ? "Supplier / Inward" : "Central HQ");
                    const destName =
                      tx.destination?.name ||
                      (isSale
                        ? tx.sale?.customer?.shopName
                          ? `${tx.sale.customer.shopName}`
                          : "Customer Sale Order"
                        : "Central HQ");

                    const shortId = tx.id.slice(0, 8);

                    return (
                      <tr key={tx.id} className="hover:bg-[#FFFDFD] transition">
                        {/* Date & Time */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                              <Calendar className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <span className="font-bold text-zinc-950 block">{formattedDate}</span>
                              <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3" /> {formattedTime}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Reference ID */}
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => handleCopyTxId(tx.id)}
                            title="Click to copy full transaction UUID"
                            className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 font-mono text-[11px] font-bold text-zinc-700 hover:bg-zinc-200 transition"
                          >
                            <span>#{shortId}</span>
                            {copiedTxId === tx.id ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-2.5 w-2.5 text-zinc-400" />
                            )}
                          </button>
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
                            {isInward ? "Stock Inward" : isTransfer ? "Transfer" : "Confirmed Sale"}
                          </span>
                        </td>

                        {/* Origin (From) */}
                        <td className="py-3.5 px-3 font-semibold text-zinc-900 max-w-40 truncate">
                          {originName}
                        </td>

                        {/* Route Flow */}
                        <td className="py-3.5 px-3 text-center text-zinc-300">
                          <ArrowRight className="h-4 w-4 mx-auto text-zinc-400" />
                        </td>

                        {/* Destination (To) */}
                        <td className="py-3.5 px-3 font-semibold text-zinc-900 max-w-44 truncate">
                          {destName}
                          {isSale && tx.sale?.customer?.contactName && (
                            <span className="block text-[10px] text-zinc-400 font-normal">
                              {tx.sale.customer.contactName}
                            </span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-extrabold text-sm text-zinc-950">
                            {tx.quantity.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-medium ml-1">pkts</span>
                        </td>

                        {/* Responsible User / Actor */}
                        <td className="py-3.5 px-3 text-zinc-700">
                          <span className="font-medium block">{tx.actor?.name || "System"}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                            {tx.actor?.role || "Admin"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {txTotalPages > 1 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-100 text-xs">
                <span className="text-zinc-500 font-medium">
                  Showing {(txPage - 1) * txPageSize + 1} to{" "}
                  {Math.min(txPage * txPageSize, txTotalCount)} of {txTotalCount} total stock movements
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={txPage <= 1}
                    onClick={() => {
                      const newP = txPage - 1;
                      setTxPage(newP);
                      fetchTransactions(newP, historyFilterType);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </button>

                  <span className="px-3 py-1.5 font-bold text-zinc-800">
                    Page {txPage} of {txTotalPages}
                  </span>

                  <button
                    disabled={txPage >= txTotalPages}
                    onClick={() => {
                      const newP = txPage + 1;
                      setTxPage(newP);
                      fetchTransactions(newP, historyFilterType);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. MODALS */}
      {/* ======================================================== */}

      {/* Edit Available Stock Modal */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-zinc-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-amber-50 p-2 text-amber-800">
                  <Edit3 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-playfair text-lg font-bold text-zinc-950">
                    Edit Available Stock
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Update current physical packet count for <span className="font-bold text-zinc-900">{editingLocation.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLocation(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStockBalance} className="mt-5 space-y-4">
              {editStockError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">
                  {editStockError}
                </p>
              )}
              {editStockNotice && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  {editStockNotice}
                </p>
              )}

              <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/80 text-xs flex items-center justify-between">
                <span className="font-bold text-zinc-600">Current Balance:</span>
                <span className="font-extrabold text-zinc-900 text-sm">
                  {editingLocation.balance.toLocaleString("en-IN")} packets
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800">
                  New Available Stock Balance (packets) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editStockValue}
                  onChange={(e) =>
                    setEditStockValue(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="e.g. 50"
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  Directly adjust available stock if physical count differs or stock is low.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800">
                  Reason for Adjustment <span className="font-normal text-zinc-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={editStockReason}
                  onChange={(e) => setEditStockReason(e.target.value)}
                  placeholder="e.g. Physical inventory count discrepancy / low stock top-up"
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-medium outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditStockSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 px-5 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition cursor-pointer"
                >
                  {isEditStockSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Update Stock Balance"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inward Stock Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-zinc-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-emerald-50 p-2 text-[#156035]">
                  <PackagePlus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-playfair text-lg font-bold text-zinc-950">
                    Inward Stock to HQ
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Receive verified manufacturing packets into Central Reserve
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
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
                  Packet Quantity to Inward *
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
                <p className="mt-1 text-[11px] text-zinc-500">
                  Packets are incremented into the central Headquarters (HQ) reserve.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition"
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
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
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
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
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
