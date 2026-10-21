"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
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
  Gift,
  History,
  IndianRupee,
  Info,
  Layers,
  Loader2,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
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
import type {
  InventorySummaryData,
  StockTransactionItem,
  WarehouseItem,
  AdminDashboardData,
  AdminIncentivesResponse,
} from "@/lib/api/types";

export default function AdminInventoryPage() {
  const ledgerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<InventorySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Secondary metrics
  const [dashData, setDashData] = useState<AdminDashboardData | null>(null);
  const [incentiveData, setIncentiveData] = useState<AdminIncentivesResponse | null>(null);

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

  // Products for inward modal
  const [inwardProducts, setInwardProducts] = useState<Array<{ id: string; name: string; sku: string | null }>>([]);
  const [inwardItems, setInwardItems] = useState<Array<{ productId: string; quantity: number | string }>>([]);

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

  // Delete warehouse state
  const [deletingLocation, setDeletingLocation] = useState<WarehouseItem | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

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

  const fetchProducts = async () => {
    try {
      const res = await adminApi.listProducts({ active: "true" });
      const items = res?.items ?? [];
      setInwardProducts(items.map((p) => ({ id: p.id, name: p.name, sku: p.sku })));
      if (items.length > 0) {
        setInwardItems([{ productId: items[0].id, quantity: 500 }]);
      }
    } catch {
      // Ignored
    }
  };

  const fetchSecondaryMetrics = async () => {
    try {
      const [dash, incent] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getIncentives(),
      ]);
      if (dash.status === "fulfilled") setDashData(dash.value);
      if (incent.status === "fulfilled") setIncentiveData(incent.value);
    } catch {
      // Non-critical
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(),
      fetchTransactions(1, historyFilterType),
      fetchProducts(),
      fetchSecondaryMetrics(),
    ]);
    setTxPage(1);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUpdateStockBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    if (editStockValue === "" || editStockValue === null || editStockValue === undefined) {
      setEditStockError("Please enter a valid stock balance (0 or greater).");
      return;
    }

    const num = Number(editStockValue);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      setEditStockError("Please enter a valid integer stock balance (0 or greater).");
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
      console.error("updateLocationBalance error detail:", err?.data || err?.message || err);
      const serverMsg =
        (err?.data && typeof err.data === "object" && (err.data.message || err.data.error)) ||
        err?.message ||
        "Failed to update stock balance.";
      setEditStockError(serverMsg);
    } finally {
      setIsEditStockSubmitting(false);
    }
  };

  const handleInwardStock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inwardProducts.length > 0) {
      const validItems = inwardItems.filter((it) => it.productId && Number(it.quantity) > 0);
      if (validItems.length === 0) {
        setInwardError("Add at least one product with a valid quantity.");
        return;
      }
      for (const it of validItems) {
        const qty = Number(it.quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
          setInwardError("All quantities must be positive integers.");
          return;
        }
      }

      setIsInwardSubmitting(true);
      setInwardError("");
      setInwardNotice("");

      try {
        await adminApi.addReceipt({
          items: validItems.map((it) => ({ productId: it.productId, quantity: Number(it.quantity) })),
        });
        const totalQty = validItems.reduce((s, it) => s + Number(it.quantity), 0);
        setInwardNotice(`Successfully inwarded ${totalQty.toLocaleString("en-IN")} packets to HQ Central.`);
        setInwardItems(inwardProducts.length > 0 ? [{ productId: inwardProducts[0].id, quantity: 500 }] : []);
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
    } else {
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

  const handleDeleteWarehouse = async () => {
    if (!deletingLocation) return;
    const targetLoc = deletingLocation;

    if (targetLoc.balance > 0) {
      setDeleteError(`Cannot delete warehouse with active stock balance (${targetLoc.balance.toLocaleString("en-IN")} packets). Please reset stock to 0 or transfer it first.`);
      return;
    }

    setIsDeleteSubmitting(true);
    setDeleteError(null);

    // Fast optimistic UI update: remove instantly from local state
    const previousData = data;
    setData((prev) => {
      if (!prev) return prev;
      const updatedLocations = (prev.locations || []).filter((l) => l.id !== targetLoc.id);
      const updatedWarehouses = (prev.warehouses || []).filter((l) => l.id !== targetLoc.id);
      return {
        ...prev,
        locations: updatedLocations,
        warehouses: updatedWarehouses,
      };
    });

    try {
      await adminApi.deleteWarehouse(targetLoc.id);
      setDeleteNotice(`Warehouse "${targetLoc.name}" was successfully deleted.`);
      setTimeout(() => {
        setDeletingLocation(null);
        setDeleteNotice(null);
        setIsDeleteSubmitting(false);
      }, 700);
      fetchSummary();
    } catch (err: unknown) {
      // Revert optimistic removal on error
      setData(previousData);
      const msg = err instanceof Error ? err.message : "Failed to delete warehouse.";
      setDeleteError(msg);
      setIsDeleteSubmitting(false);
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

  // Percentage distribution calculations
  const hqPercent = totalStock > 0 ? Math.round((hqStock / totalStock) * 100) : 0;
  const whPercent = totalStock > 0 ? Math.round((whStock / totalStock) * 100) : 0;
  const slPercent = totalStock > 0 ? Math.round((slStock / totalStock) * 100) : 0;
  const remainingPercent = totalReceived > 0 ? ((totalStock / totalReceived) * 100).toFixed(1) : null;

  // Distributed stock = stock held outside HQ (depots + field officers)
  const distributedStock = whStock + slStock;

  // Secondary metrics from dashboard data
  const totalSellers = dashData?.metrics?.totalSellers ?? null;
  const totalShops = dashData?.metrics?.totalShops ?? null;
  const pendingPaymentPaise = incentiveData?.summary?.totalPendingPaise ?? null;
  const totalEarnedIncentivePaise = incentiveData?.summary?.totalEarnedPaise ?? null;
  const totalPaidIncentivePaise = incentiveData?.summary?.totalPaidPaise ?? null;

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

  const formatINR = (paise: number) => {
    const rupees = paise / 100;
    if (rupees >= 100000) return `${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `${(rupees / 1000).toFixed(1)}K`;
    return rupees.toLocaleString("en-IN");
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
        description="Real-time stock hierarchy, warehouse balances, and dispatch movement history."
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
      {/* 1. PRIMARY STOCK METRICS CARDS */}
      {/* ======================================================== */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[132px] rounded-2xl border border-zinc-200 bg-white p-5 animate-pulse flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-zinc-200 rounded" />
                  <div className="h-9 w-9 bg-zinc-100 rounded-xl" />
                </div>
                <div className="h-8 w-32 bg-zinc-200 rounded mt-2" />
                <div className="h-3 w-40 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* CARD 1 — Total Received */}
            <button
              onClick={() => scrollToHistory("RECEIPT")}
              className="group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#156035]/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Total Received
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#156035] transition-transform group-hover:scale-110">
                  <PackagePlus className="h-4.5 w-4.5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className={`text-[28px] font-extrabold leading-none tracking-tight ${totalReceived === 0 ? "text-zinc-300" : "text-zinc-900"}`}>
                  {totalReceived.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-medium text-zinc-400">packets</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">All-time supplier receipts</span>
                <span className="text-[11px] font-semibold text-[#156035] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  View <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>

            {/* CARD 2 — Available Stock (Hero) */}
            <button
              onClick={() => scrollToLedger("all")}
              className="group relative flex flex-col rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-300 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#156035]">
                    Available Stock
                  </span>
                  {remainingPercent && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-px text-[9px] font-bold text-[#156035]">
                      {remainingPercent}%
                    </span>
                  )}
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#156035] text-white transition-transform group-hover:scale-110">
                  <Boxes className="h-4.5 w-4.5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className={`text-[28px] font-extrabold leading-none tracking-tight ${totalStock === 0 ? "text-zinc-300" : "text-[#156035]"}`}>
                  {totalStock.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-medium text-emerald-600/70">packets</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">HQ + depots + field officers</span>
                <span className="text-[11px] font-semibold text-[#156035] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Ledger <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>

            {/* CARD 3 — Stock Distributed */}
            <button
              onClick={() => scrollToHistory("TRANSFER")}
              className="group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-sky-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Stock Distributed
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-transform group-hover:scale-110">
                  <ArrowRightLeft className="h-4.5 w-4.5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className={`text-[28px] font-extrabold leading-none tracking-tight ${distributedStock === 0 ? "text-zinc-300" : "text-zinc-900"}`}>
                  {distributedStock.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-medium text-zinc-400">packets</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">Across depots & field officers</span>
                <span className="text-[11px] font-semibold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  History <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>

            {/* CARD 4 — Total Sold */}
            <Link
              href="/admin/sales"
              className="group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-rose-200 text-left focus:outline-none focus:ring-2 focus:ring-[#E61C5D]/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Total Sold
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D] transition-transform group-hover:scale-110">
                  <PackageCheck className="h-4.5 w-4.5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className={`text-[28px] font-extrabold leading-none tracking-tight ${totalSold === 0 ? "text-zinc-300" : "text-zinc-900"}`}>
                  {totalSold.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-medium text-zinc-400">packets</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">Confirmed retail sales only</span>
                <span className="text-[11px] font-semibold text-[#E61C5D] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Sales <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. SECONDARY BUSINESS OVERVIEW CARDS */}
      {/* ======================================================== */}
      <div className="mt-4">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {/* Total Sellers */}
          <Link
            href="/admin/sellers"
            className="group flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3.5 shadow-xs transition hover:shadow-md hover:border-zinc-300"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Users className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Sellers</span>
              <span className={`block text-lg font-extrabold leading-tight ${totalSellers === null ? "text-zinc-300" : "text-zinc-900"}`}>
                {totalSellers !== null ? totalSellers.toLocaleString("en-IN") : "—"}
              </span>
            </div>
          </Link>

          {/* Total Shops */}
          <Link
            href="/admin/customers"
            className="group flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3.5 shadow-xs transition hover:shadow-md hover:border-zinc-300"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Shops</span>
              <span className={`block text-lg font-extrabold leading-tight ${totalShops === null ? "text-zinc-300" : "text-zinc-900"}`}>
                {totalShops !== null ? totalShops.toLocaleString("en-IN") : "—"}
              </span>
            </div>
          </Link>

          {/* Pending Payments */}
          <Link
            href="/admin/incentives"
            className="group flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3.5 shadow-xs transition hover:shadow-md hover:border-zinc-300"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <IndianRupee className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Pending Payments</span>
              <span className={`block text-lg font-extrabold leading-tight ${pendingPaymentPaise === null ? "text-zinc-300" : "text-zinc-900"}`}>
                {pendingPaymentPaise !== null ? `₹${formatINR(pendingPaymentPaise)}` : "—"}
              </span>
            </div>
          </Link>

          {/* Incentives */}
          <Link
            href="/admin/incentives"
            className="group flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3.5 shadow-xs transition hover:shadow-md hover:border-zinc-300"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Gift className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Incentives Earned</span>
              <span className={`block text-lg font-extrabold leading-tight ${totalEarnedIncentivePaise === null ? "text-zinc-300" : "text-zinc-900"}`}>
                {totalEarnedIncentivePaise !== null ? `₹${formatINR(totalEarnedIncentivePaise)}` : "—"}
              </span>
              {totalPaidIncentivePaise !== null && totalEarnedIncentivePaise !== null && totalEarnedIncentivePaise > 0 && (
                <span className="text-[10px] text-zinc-400 font-medium">
                  ₹{formatINR(totalPaidIncentivePaise)} paid
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INVENTORY CUSTODY BREAKDOWN */}
      {/* ======================================================== */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100/80 text-amber-800">
              <Layers className="h-3 w-3" />
            </span>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-900">
              Custody Breakdown
            </h2>
            <p className="hidden sm:inline-block text-[11px] text-zinc-400 ml-1">Click any tier to filter the ledger below</p>
          </div>
          {activeTab !== "all" && (
            <button
              type="button"
              onClick={() => scrollToLedger("all")}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-900 hover:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs transition cursor-pointer"
            >
              <span>Reset Filter</span>
              <X className="h-3 w-3 ml-0.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl border border-zinc-200 bg-white p-4 animate-pulse flex flex-col justify-between">
                <div className="h-3 w-24 bg-zinc-200 rounded" />
                <div className="h-7 w-28 bg-zinc-200 rounded" />
                <div className="h-2.5 w-32 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Tier Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* HQ Central */}
              {(() => {
                const isSelected = activeTab === "hq";
                return (
                  <button
                    onClick={() => scrollToLedger(isSelected ? "all" : "hq")}
                    className={`group flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#156035]/40 ${
                      isSelected
                        ? "border-[#156035] bg-emerald-50/60 shadow-md"
                        : "border-zinc-200/80 bg-white shadow-xs hover:shadow-md hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        HQ Central Reserve
                      </span>
                      <WarehouseIcon className={`h-4 w-4 shrink-0 ${isSelected ? "text-[#156035]" : "text-zinc-300 group-hover:text-[#156035]"} transition-colors`} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className={`text-2xl font-extrabold tracking-tight ${hqStock === 0 ? "text-zinc-300" : isSelected ? "text-[#156035]" : "text-zinc-900"}`}>
                        {hqStock.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-medium text-zinc-400">pkts</span>
                      {totalStock > 0 && (
                        <span className="ml-auto rounded-full bg-emerald-100 px-1.5 py-px text-[9px] font-bold text-[#156035]">
                          {hqPercent}%
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 text-[11px] text-zinc-500">
                      Central intake warehouse
                    </span>
                  </button>
                );
              })()}

              {/* Regional Depots */}
              {(() => {
                const isSelected = activeTab === "warehouses";
                return (
                  <button
                    onClick={() => scrollToLedger(isSelected ? "all" : "warehouses")}
                    className={`group flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                      isSelected
                        ? "border-amber-400 bg-amber-50/60 shadow-md"
                        : "border-zinc-200/80 bg-white shadow-xs hover:shadow-md hover:border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        Regional Depots
                      </span>
                      <Building2 className={`h-4 w-4 shrink-0 ${isSelected ? "text-amber-700" : "text-zinc-300 group-hover:text-amber-600"} transition-colors`} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className={`text-2xl font-extrabold tracking-tight ${whStock === 0 ? "text-zinc-300" : isSelected ? "text-amber-800" : "text-zinc-900"}`}>
                        {whStock.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-medium text-zinc-400">pkts</span>
                      {totalStock > 0 && (
                        <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-bold text-amber-900">
                          {whPercent}%
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 text-[11px] text-zinc-500">
                      {regionalWarehouses.length} active depot{regionalWarehouses.length === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })()}

              {/* Field Officers */}
              {(() => {
                const isSelected = activeTab === "sellers";
                return (
                  <button
                    onClick={() => scrollToLedger(isSelected ? "all" : "sellers")}
                    className={`group flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#E61C5D]/40 ${
                      isSelected
                        ? "border-rose-300 bg-rose-50/60 shadow-md"
                        : "border-zinc-200/80 bg-white shadow-xs hover:shadow-md hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        Field Officers
                      </span>
                      <Store className={`h-4 w-4 shrink-0 ${isSelected ? "text-[#E61C5D]" : "text-zinc-300 group-hover:text-[#E61C5D]"} transition-colors`} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className={`text-2xl font-extrabold tracking-tight ${slStock === 0 ? "text-zinc-300" : isSelected ? "text-[#E61C5D]" : "text-zinc-900"}`}>
                        {slStock.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-medium text-zinc-400">pkts</span>
                      {totalStock > 0 && (
                        <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-px text-[9px] font-bold text-[#E61C5D]">
                          {slPercent}%
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 text-[11px] text-zinc-500">
                      {sellerWarehouses.length} field officer{sellerWarehouses.length === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })()}

              {/* Zero Stock */}
              {(() => {
                const isSelected = activeTab === "zero";
                const count = zeroStockLocations.length;
                const hasWarning = count > 0;
                return (
                  <button
                    onClick={() => scrollToLedger(isSelected ? "all" : "zero")}
                    className={`group flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-zinc-800/40 ${
                      isSelected
                        ? "border-zinc-400 bg-zinc-100/80 shadow-md"
                        : "border-zinc-200/80 bg-white shadow-xs hover:shadow-md hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        Zero Stock
                      </span>
                      <PackageMinus className={`h-4 w-4 shrink-0 ${hasWarning ? "text-amber-500" : "text-zinc-300"} transition-colors`} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className={`text-2xl font-extrabold tracking-tight ${hasWarning ? "text-amber-600" : "text-zinc-300"}`}>
                        {count}
                      </span>
                      <span className="text-xs font-medium text-zinc-400">
                        {count === 1 ? "location" : "locations"}
                      </span>
                      {hasWarning && (
                        <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-bold text-amber-800">
                          Needs stock
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 text-[11px] text-zinc-500">
                      {hasWarning ? "Depots or sellers with 0 packets" : "All locations have active stock"}
                    </span>
                  </button>
                );
              })()}
            </div>

            {/* Distribution Bar */}
            {totalStock > 0 && (
              <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-zinc-400" /> Stock Distribution
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                    <span className="inline-flex items-center gap-1.5 text-[#156035]">
                      <span className="h-2 w-2 rounded-full bg-[#156035]" /> HQ {hqPercent}%
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Depots {whPercent}%
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-700">
                      <span className="h-2 w-2 rounded-full bg-[#E61C5D]" /> Officers {slPercent}%
                    </span>
                  </div>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                  {hqStock > 0 && (
                    <div
                      style={{ width: `${hqPercent}%` }}
                      title={`HQ: ${hqStock.toLocaleString("en-IN")} pkts (${hqPercent}%)`}
                      className="h-full bg-[#156035] first:rounded-l-full last:rounded-r-full transition-all duration-500"
                    />
                  )}
                  {whStock > 0 && (
                    <div
                      style={{ width: `${whPercent}%` }}
                      title={`Depots: ${whStock.toLocaleString("en-IN")} pkts (${whPercent}%)`}
                      className="h-full bg-amber-500 first:rounded-l-full last:rounded-r-full transition-all duration-500"
                    />
                  )}
                  {slStock > 0 && (
                    <div
                      style={{ width: `${slPercent}%` }}
                      title={`Officers: ${slStock.toLocaleString("en-IN")} pkts (${slPercent}%)`}
                      className="h-full bg-[#E61C5D] first:rounded-l-full last:rounded-r-full transition-all duration-500"
                    />
                  )}
                </div>
                <p className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
                  <Info className="h-3 w-3 shrink-0" />
                  Transfers reallocate custody — they don't alter total inventory ({totalStock.toLocaleString("en-IN")} pkts).
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. QUICK ACTIONS */}
      {/* ======================================================== */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1">Quick Actions</span>
        <button
          onClick={() => { setShowInwardModal(true); setInwardError(""); setInwardNotice(""); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:border-emerald-200 hover:text-[#156035] transition"
        >
          <PackagePlus className="h-3.5 w-3.5 text-[#156035]" /> Stock Inward
        </button>
        <button
          onClick={() => { setShowWarehouseModal(true); setWarehouseError(""); setWarehouseNotice(""); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:border-rose-200 hover:text-[#E61C5D] transition"
        >
          <Building2 className="h-3.5 w-3.5 text-[#E61C5D]" /> Add Warehouse
        </button>
        <Link
          href="/admin/inventory/transfers"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:border-sky-200 hover:text-sky-700 transition"
        >
          <Truck className="h-3.5 w-3.5 text-sky-600" /> Transfer Stock
        </Link>
        <Link
          href="/admin/approvals"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:border-amber-200 hover:text-amber-700 transition"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" /> Pending Approvals
        </Link>
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:border-violet-200 hover:text-violet-700 transition"
        >
          <Layers className="h-3.5 w-3.5 text-violet-500" /> View Reports
        </Link>
      </div>

      {/* ======================================================== */}
      {/* 5. WAREHOUSES & LOCATIONS STOCK LEDGER */}
      {/* ======================================================== */}
      <div ref={ledgerRef} className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <h3 className="text-base font-bold text-zinc-950">
              Warehouse & Location Stock Ledger
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Packet balances, inward/outward totals, and last movement per location
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search warehouse or officer..."
                className="h-10 w-full sm:w-56 rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-8 text-xs font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
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

            <div className="flex flex-wrap items-center rounded-xl bg-zinc-100 p-1 text-xs font-bold text-zinc-600">
              {([
                { key: "all" as const, label: "All", count: allLocations.length },
                { key: "hq" as const, label: "HQ", count: hqWarehouses.length },
                { key: "warehouses" as const, label: "Depots", count: regionalWarehouses.length },
                { key: "sellers" as const, label: "Officers", count: sellerWarehouses.length },
                { key: "zero" as const, label: "Zero", count: zeroStockLocations.length },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`rounded-lg px-2.5 py-1.5 transition ${
                    activeTab === t.key ? "bg-white text-zinc-950 shadow-xs" : "hover:text-zinc-950"
                  }`}
                >
                  {t.label} ({t.count})
                </button>
              ))}
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
            {/* MOBILE LOCATION CARDS */}
            <div className="md:hidden mt-4 space-y-3">
              {displayedLocations.map((loc) => {
                const share = totalStock > 0 ? ((loc.balance / totalStock) * 100).toFixed(1) : "0.0";
                const isHQ = loc.type === "HQ";
                const isWarehouse = loc.type === "WAREHOUSE";
                const lastMoveText = loc.lastMovementAt
                  ? new Date(loc.lastMovementAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                  : "No movements";

                return (
                  <div key={`m-${loc.id}`} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isHQ ? "bg-emerald-50 text-[#156035]" : isWarehouse ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-[#E61C5D]"
                        }`}>
                          {isHQ ? <WarehouseIcon className="h-4.5 w-4.5" /> : isWarehouse ? <Building2 className="h-4.5 w-4.5" /> : <Store className="h-4.5 w-4.5" />}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-950">{loc.name}</h4>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            isHQ ? "bg-emerald-50 text-[#156035]" : isWarehouse ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-800"
                          }`}>
                            {isHQ ? "HQ Reserve" : isWarehouse ? "Regional Depot" : "Field Officer"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-base font-extrabold block ${
                          isHQ ? "text-[#156035]" : isWarehouse ? "text-amber-800" : "text-rose-700"
                        }`}>
                          {loc.balance.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">pkts ({share}%)</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2 text-center text-[11px]">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase">Received</span>
                        <span className="font-bold text-zinc-800">{(loc.received ?? 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase">Dispatched</span>
                        <span className="font-bold text-zinc-800">{(loc.transferredOut ?? 0).toLocaleString("en-IN")}</span>
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
                      <span className="text-[11px] text-zinc-500 font-medium">Last: {lastMoveText}</span>
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
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                        <Link
                          href={`/admin/inventory/transfers?source=${loc.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-800 hover:text-[#E61C5D] hover:border-rose-200"
                        >
                          Transfer <ArrowRight className="h-3 w-3" />
                        </Link>
                        {!isHQ && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingLocation(loc);
                              setDeleteError(null);
                              setDeleteNotice(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 text-rose-600" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block mt-4 overflow-x-auto">
              <table className="w-full min-w-200 text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-3">Location & ID</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3 text-right">Available</th>
                    <th className="py-3 px-3 text-right">Received</th>
                    <th className="py-3 px-3 text-right">Transferred Out</th>
                    <th className="py-3 px-3 text-right">Sold</th>
                    <th className="py-3 px-3 text-center">Last Movement</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {displayedLocations.map((loc) => {
                    const share = totalStock > 0 ? ((loc.balance / totalStock) * 100).toFixed(1) : "0.0";
                    const isHQ = loc.type === "HQ";
                    const isWarehouse = loc.type === "WAREHOUSE";
                    const lastMoveFormatted = loc.lastMovementAt
                      ? new Date(loc.lastMovementAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—";

                    return (
                      <tr key={loc.id} className="hover:bg-zinc-50/60 transition group">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              isHQ ? "bg-emerald-50 text-[#156035]" : isWarehouse ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-[#E61C5D]"
                            }`}>
                              {isHQ ? <WarehouseIcon className="h-4 w-4" /> : isWarehouse ? <Building2 className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                            </span>
                            <div>
                              <span className="font-bold text-zinc-950 block">{loc.name}</span>
                              <span className="text-[11px] text-zinc-400 font-medium">ID: {loc.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isHQ ? "bg-emerald-50 text-[#156035]" : isWarehouse ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-800"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isHQ ? "bg-[#156035]" : isWarehouse ? "bg-amber-600" : "bg-[#E61C5D]"}`} />
                            {isHQ ? "Central HQ" : isWarehouse ? "Regional Depot" : "Field Officer"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`text-sm font-extrabold ${
                            isHQ ? "text-[#156035]" : isWarehouse ? "text-amber-800" : "text-rose-700"
                          }`}>
                            {loc.balance.toLocaleString("en-IN")}
                          </span>
                          <span className="block text-[10px] text-zinc-400 font-medium">{share}%</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-zinc-800">
                          {(loc.received ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-zinc-800">
                          {(loc.transferredOut ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {loc.type === "SELLER" ? (
                            <span className="font-bold text-purple-700">{(loc.sold ?? 0).toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-zinc-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center text-zinc-600 font-medium text-[11px]">
                          {lastMoveFormatted}
                        </td>
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
                            >
                              <Edit3 className="h-3 w-3 text-amber-700" /> Edit
                            </button>
                            <Link
                              href={`/admin/inventory/transfers?source=${loc.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-bold text-zinc-800 hover:border-rose-200 hover:text-[#E61C5D] hover:bg-rose-50/50 transition"
                            >
                              Transfer <ArrowRight className="h-3 w-3" />
                            </Link>
                            {!isHQ && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingLocation(loc);
                                  setDeleteError(null);
                                  setDeleteNotice(null);
                                }}
                                title={`Delete ${loc.name}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="h-3 w-3 text-rose-600" /> Delete
                              </button>
                            )}
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
      {/* 6. STOCK MOVEMENT HISTORY */}
      {/* ======================================================== */}
      <div ref={historyRef} className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
              <History className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-zinc-950">
                Stock Movement History
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Receipts, transfers, and confirmed sale deductions
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search origin, destination, actor..."
                className="h-10 w-full sm:w-64 rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-8 text-xs font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
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

            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1">
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
                <option value="ALL">All Types</option>
                <option value="RECEIPT">Stock Inward</option>
                <option value="TRANSFER">Transfers</option>
                <option value="SALE">Confirmed Sales</option>
              </select>
            </div>
          </div>
        </div>

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
              Retry
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
                onClick={() => { setShowInwardModal(true); setInwardError(""); setInwardNotice(""); }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition"
              >
                <PackagePlus className="h-4 w-4" /> Perform Stock Inward
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* MOBILE HISTORY CARDS */}
            <div className="md:hidden mt-4 space-y-3">
              {displayedTransactions.map((tx) => {
                const dateObj = new Date(tx.createdAt);
                const formattedDate = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                const formattedTime = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                const isInward = tx.type === "RECEIPT";
                const isTransfer = tx.type === "TRANSFER";
                const isSale = tx.type === "SALE";
                const originName = tx.source?.name || (isInward ? "Supplier / Inward" : "Central HQ");
                const destName = tx.destination?.name || (isSale ? (tx.sale?.customer?.shopName ? `Sale: ${tx.sale.customer.shopName}` : "Customer Sale Order") : "Central HQ");

                return (
                  <div key={`m-tx-${tx.id}`} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isInward ? "bg-emerald-50 text-[#156035]" : isTransfer ? "bg-sky-50 text-sky-800" : "bg-purple-50 text-purple-800"
                      }`}>
                        {isInward ? <PackagePlus className="h-3 w-3" /> : isTransfer ? <ArrowRightLeft className="h-3 w-3" /> : <PackageCheck className="h-3 w-3" />}
                        {isInward ? "Inward" : isTransfer ? "Transfer" : "Sale"}
                      </span>
                      <span className="text-sm font-extrabold text-zinc-950">
                        {tx.quantity.toLocaleString("en-IN")} pkts
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 pt-2.5">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">From</span>
                        <span className="font-semibold text-zinc-900 block truncate mt-0.5">{originName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">To</span>
                        <span className="font-semibold text-zinc-900 block truncate mt-0.5">{destName}</span>
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

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block mt-4 overflow-x-auto">
              <table className="w-full min-w-220 text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Ref ID</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">From</th>
                    <th className="py-3 px-3 text-center">Flow</th>
                    <th className="py-3 px-3">To</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3">By</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {displayedTransactions.map((tx) => {
                    const dateObj = new Date(tx.createdAt);
                    const formattedDate = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                    const formattedTime = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                    const isInward = tx.type === "RECEIPT";
                    const isTransfer = tx.type === "TRANSFER";
                    const isSale = tx.type === "SALE";
                    const originName = tx.source?.name || (isInward ? "Supplier / Inward" : "Central HQ");
                    const destName = tx.destination?.name || (isSale ? (tx.sale?.customer?.shopName || "Customer Sale Order") : "Central HQ");
                    const shortId = tx.id.slice(0, 8);

                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50/60 transition">
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
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => handleCopyTxId(tx.id)}
                            title="Copy full transaction ID"
                            className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 font-mono text-[11px] font-bold text-zinc-700 hover:bg-zinc-200 transition"
                          >
                            <span>#{shortId}</span>
                            {copiedTxId === tx.id ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Copy className="h-2.5 w-2.5 text-zinc-400" />}
                          </button>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isInward ? "bg-emerald-50 text-[#156035]" : isTransfer ? "bg-sky-50 text-sky-800" : isSale ? "bg-purple-50 text-purple-800" : "bg-rose-50 text-rose-800"
                          }`}>
                            {isInward ? <PackagePlus className="h-3 w-3" /> : isTransfer ? <ArrowRightLeft className="h-3 w-3" /> : isSale ? <PackageCheck className="h-3 w-3" /> : <PackageMinus className="h-3 w-3" />}
                            {isInward ? "Inward" : isTransfer ? "Transfer" : "Sale"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-900 max-w-40 truncate">{originName}</td>
                        <td className="py-3.5 px-3 text-center"><ArrowRight className="h-4 w-4 mx-auto text-zinc-300" /></td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-900 max-w-44 truncate">
                          {destName}
                          {isSale && tx.sale?.customer?.contactName && (
                            <span className="block text-[10px] text-zinc-400 font-normal">{tx.sale.customer.contactName}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-extrabold text-sm text-zinc-950">{tx.quantity.toLocaleString("en-IN")}</span>
                          <span className="text-[11px] text-zinc-500 font-medium ml-1">pkts</span>
                        </td>
                        <td className="py-3.5 px-3 text-zinc-700">
                          <span className="font-medium block">{tx.actor?.name || "System"}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase">{tx.actor?.role || "Admin"}</span>
                        </td>
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

            {/* Pagination */}
            {txTotalPages > 1 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-100 text-xs">
                <span className="text-zinc-500 font-medium">
                  Showing {(txPage - 1) * txPageSize + 1} to {Math.min(txPage * txPageSize, txTotalCount)} of {txTotalCount} movements
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={txPage <= 1}
                    onClick={() => { const p = txPage - 1; setTxPage(p); fetchTransactions(p, historyFilterType); }}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <span className="px-3 py-1.5 font-bold text-zinc-800">
                    {txPage} / {txTotalPages}
                  </span>
                  <button
                    disabled={txPage >= txTotalPages}
                    onClick={() => { const p = txPage + 1; setTxPage(p); fetchTransactions(p, historyFilterType); }}
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
      {/* MODALS */}
      {/* ======================================================== */}

      {/* Edit Available Stock Modal */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                  <Edit3 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950">Edit Available Stock</h3>
                  <p className="text-xs text-zinc-600">
                    Update packet count for <span className="font-bold text-zinc-900">{editingLocation.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLocation(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStockBalance} className="mt-4 sm:mt-5 space-y-4">
              {editStockError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">{editStockError}</p>
              )}
              {editStockNotice && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{editStockNotice}</p>
              )}

              <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/80 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-600 block">Current Balance:</span>
                  <span className="font-extrabold text-zinc-900 text-sm">
                    {editingLocation.balance.toLocaleString("en-IN")} packets
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditStockValue(0);
                    setEditStockReason("Reset stock balance to 0 (HQ/Warehouse clearance)");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-[#E61C5D] hover:bg-rose-100 transition cursor-pointer"
                >
                  <PackageMinus className="h-3.5 w-3.5" /> Reset to 0
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800">
                  New Available Stock Balance <span className="text-[#E61C5D]">*</span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStockValue}
                    onChange={(e) => setEditStockValue(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-3 pr-14 text-sm font-semibold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">packets</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800">
                  Reason <span className="font-normal text-zinc-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={editStockReason}
                  onChange={(e) => setEditStockReason(e.target.value)}
                  placeholder="e.g. Physical count discrepancy"
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-100">
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
                  {isEditStockSubmitting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>) : "Update Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inward Stock Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#156035]">
                  <PackagePlus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950">Inward Stock to HQ</h3>
                  <p className="text-xs text-zinc-600">Receive verified packets into Central Reserve</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInwardStock} className="mt-4 sm:mt-5 space-y-4">
              {inwardError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">{inwardError}</p>
              )}
              {inwardNotice && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{inwardNotice}</p>
              )}

              {inwardProducts.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-800">
                      Products & Quantities <span className="text-[#E61C5D]">*</span>
                    </label>
                    {inwardItems.length < inwardProducts.length && (
                      <button
                        type="button"
                        onClick={() => {
                          const unused = inwardProducts.find((p) => !inwardItems.some((it) => it.productId === p.id));
                          if (unused) setInwardItems((prev) => [...prev, { productId: unused.id, quantity: 100 }]);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#E61C5D] hover:text-[#c91550] transition cursor-pointer"
                      >
                        + Add product
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {inwardItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 sm:p-2 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition">
                        <div className="flex-1 min-w-0">
                          <label className="block sm:hidden text-[11px] font-semibold text-zinc-500 mb-1">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const newItems = [...inwardItems];
                              newItems[idx] = { ...newItems[idx], productId: e.target.value };
                              setInwardItems(newItems);
                            }}
                            className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition truncate"
                          >
                            {inwardProducts.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 sm:w-28">
                            <label className="block sm:hidden text-[11px] font-semibold text-zinc-500 mb-1">Quantity</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...inwardItems];
                                  newItems[idx] = { ...newItems[idx], quantity: e.target.value === "" ? "" : Number(e.target.value) };
                                  setInwardItems(newItems);
                                }}
                                placeholder="Qty"
                                className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-3 pr-10 text-xs sm:text-sm font-semibold text-zinc-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 pointer-events-none">pkts</span>
                            </div>
                          </div>
                          {inwardItems.length > 1 && (
                            <div className="pt-5 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => setInwardItems((prev) => prev.filter((_, i) => i !== idx))}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:border-rose-200 hover:bg-rose-50 hover:text-[#E61C5D] transition cursor-pointer"
                                title="Remove item"
                                aria-label="Remove item"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-100 text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>Total Packets:</span>
                    <span className="font-bold text-zinc-900">
                      {inwardItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0).toLocaleString("en-IN")} pkts
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-800">
                    Packet Quantity <span className="text-[#E61C5D]">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={inwardQty}
                      onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-3 pr-12 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">pkts</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">Packets are added to HQ Central Reserve.</p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInwardSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#156035] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#0f4e2b] disabled:opacity-50 transition cursor-pointer"
                >
                  {isInwardSubmitting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Inwarding...</>) : "Inward Stock to HQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Regional Warehouse Modal */}
      {showWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950">Add Regional Warehouse</h3>
                  <p className="text-xs text-zinc-600">Create a regional depot for buffer storage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWarehouseModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="mt-4 sm:mt-5 space-y-4">
              {warehouseError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">{warehouseError}</p>
              )}
              {warehouseNotice && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{warehouseNotice}</p>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-800">
                  Warehouse / Depot Name <span className="text-[#E61C5D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="e.g. Thane Regional Depot"
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWarehouseSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:opacity-50 transition cursor-pointer"
                >
                  {isWarehouseSubmitting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...</>) : "Create Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Location Modal (Warehouses & Field Officer Stock) */}
      {deletingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">
                    {deletingLocation.type === "SELLER" ? "Delete Field Officer Stock" : "Delete Regional Warehouse"}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {deletingLocation.type === "SELLER" ? "Remove officer inventory location from active ledger" : "Remove regional depot from active network"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeletingLocation(null);
                  setDeleteError(null);
                  setDeleteNotice(null);
                }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {deleteNotice && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{deleteNotice}</span>
              </div>
            )}

            {deleteError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#E61C5D]" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-600">
                    {deletingLocation.type === "SELLER" ? "Officer / Stock Name:" : "Warehouse Name:"}
                  </span>
                  <span className="font-extrabold text-zinc-900 text-sm">{deletingLocation.name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-zinc-600">Role / Type:</span>
                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    deletingLocation.type === "SELLER" ? "bg-rose-50 text-[#E61C5D]" : "bg-amber-50 text-amber-800"
                  }`}>
                    {deletingLocation.type === "SELLER" ? "Field Officer" : "Regional Depot"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-zinc-600">Location ID:</span>
                  <span className="font-mono text-[11px] text-zinc-500">{deletingLocation.id}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-zinc-600">Current Balance:</span>
                  <span className={`font-extrabold text-sm ${deletingLocation.balance > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                    {deletingLocation.balance.toLocaleString("en-IN")} packets
                  </span>
                </div>
              </div>

              {deletingLocation.balance > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                    <p className="leading-relaxed">
                      This location currently holds <strong>{deletingLocation.balance.toLocaleString("en-IN")} packets</strong>.
                      To protect physical inventory records, please reset stock to 0 or transfer packets before deleting.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const loc = deletingLocation;
                        setDeletingLocation(null);
                        setEditingLocation(loc);
                        setEditStockValue(0);
                        setEditStockReason(`Reset stock to 0 before deleting "${loc.name}"`);
                        setEditStockError(null);
                        setEditStockNotice(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer shadow-xs"
                    >
                      <PackageMinus className="h-3.5 w-3.5 text-amber-700" />
                      <span>Reset to 0 pkts first</span>
                    </button>
                    <Link
                      href={`/admin/inventory/transfers?source=${deletingLocation.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-800 hover:border-rose-200 hover:text-[#E61C5D] transition cursor-pointer shadow-xs"
                    >
                      <span>Transfer stock &rarr;</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Are you sure you want to permanently delete this {deletingLocation.type === "SELLER" ? "field officer stock location" : "warehouse"}? If created by mistake, deleting it will remove it from the inventory ledger and drop-downs immediately.
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingLocation(null);
                    setDeleteError(null);
                    setDeleteNotice(null);
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleteSubmitting || deletingLocation.balance > 0}
                  onClick={handleDeleteWarehouse}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {isDeleteSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>
                        {deletingLocation.type === "SELLER" ? "Delete Officer Stock" : "Delete Warehouse"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  );
}
