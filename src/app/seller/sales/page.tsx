"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
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

interface DailyGroup {
  dateKey: string;
  dayLabel: string;
  formattedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  totalPackets: number;
  totalPaise: number;
  salesCount: number;
  cashPaise: number;
  bankPaise: number;
  pendingPaise: number;
  confirmedCount: number;
  pendingCount: number;
  rejectedCount: number;
  sales: SaleItem[];
}

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
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 1 });
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"DAILY_REPORT" | "TRANSACTIONS">("DAILY_REPORT");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    [new Date().toISOString().slice(0, 10)]: true,
  });

  const toggleDateExpand = (dateKey: string) => {
    setExpandedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

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

  // Day-wise Grouping for Daily Sales Report
  const dailyGroups = useMemo<DailyGroup[]>(() => {
    const map: Record<string, {
      dateKey: string;
      dayLabel: string;
      formattedDate: string;
      isToday: boolean;
      isYesterday: boolean;
      totalPackets: number;
      totalPaise: number;
      salesCount: number;
      cashPaise: number;
      bankPaise: number;
      pendingPaise: number;
      confirmedCount: number;
      pendingCount: number;
      rejectedCount: number;
      sales: SaleItem[];
    }> = {};

    const todayStr = new Date().toISOString().slice(0, 10);
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().slice(0, 10);

    sales.forEach((s) => {
      const raw = s.createdAt || s.requestedAt;
      const dateKey = raw ? new Date(raw).toISOString().slice(0, 10) : todayStr;
      const isToday = dateKey === todayStr;
      const isYesterday = dateKey === yestStr;

      if (!map[dateKey]) {
        const parsed = new Date(raw);
        const formattedDate = !isNaN(parsed.getTime())
          ? parsed.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
          : dateKey;
        const dayLabel = isToday ? "Today" : isYesterday ? "Yesterday" : formattedDate;

        map[dateKey] = {
          dateKey,
          dayLabel,
          formattedDate,
          isToday,
          isYesterday,
          totalPackets: 0,
          totalPaise: 0,
          salesCount: 0,
          cashPaise: 0,
          bankPaise: 0,
          pendingPaise: 0,
          confirmedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          sales: [],
        };
      }

      const g = map[dateKey];
      g.totalPackets += s.quantity;
      g.totalPaise += s.totalPaise;
      g.salesCount += 1;
      if (s.paymentMode === "CASH") g.cashPaise += s.totalPaise;
      else if (s.paymentMode === "BANK") g.bankPaise += s.totalPaise;
      else g.pendingPaise += s.totalPaise;

      if (s.status === "CONFIRMED") g.confirmedCount += 1;
      else if (s.status === "PENDING_APPROVAL") g.pendingCount += 1;
      else if (s.status === "REJECTED") g.rejectedCount += 1;

      g.sales.push(s);
    });

    return Object.values(map).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [sales]);

  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayGroup = dailyGroups.find((g: DailyGroup) => g.dateKey === todayStr);
    return {
      packets: todayGroup?.totalPackets ?? 0,
      revenueRupees: (todayGroup?.totalPaise ?? 0) / 100,
      orders: todayGroup?.salesCount ?? 0,
      cashRupees: (todayGroup?.cashPaise ?? 0) / 100,
      bankRupees: (todayGroup?.bankPaise ?? 0) / 100,
      pendingRupees: (todayGroup?.pendingPaise ?? 0) / 100,
    };
  }, [dailyGroups]);

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

      {/* View Mode Toggle: Daily Sales Report vs All Transactions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-zinc-100/90 p-1.5 rounded-2xl border border-zinc-200/80">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode("DAILY_REPORT")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              viewMode === "DAILY_REPORT"
                ? "bg-white text-[#E61C5D] shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Daily Sales Report</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("TRANSACTIONS")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              viewMode === "TRANSACTIONS"
                ? "bg-white text-[#E61C5D] shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>All Transactions ({pagination.total})</span>
          </button>
        </div>
        <div className="text-[11px] text-zinc-500 font-medium px-2">
          {viewMode === "DAILY_REPORT" ? "Day-by-day sales volume, cash & customer breakdown" : "Individual invoices & price approval states"}
        </div>
      </div>

      {viewMode === "DAILY_REPORT" ? (
        <div className="mt-6 space-y-6">
          {/* Today Summary Metrics Banner */}
          <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50/60 via-white to-rose-50/40 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-rose-100/80 pb-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#E61C5D]" /> Today\'s Live Sales Performance
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 rounded-full px-2.5 py-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white border border-rose-100/80 p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Today\'s Revenue</span>
                <span className="text-xl sm:text-2xl font-black text-[#E61C5D] block mt-0.5">
                  ₹{todayStats.revenueRupees.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-zinc-500">Gross sales value</span>
              </div>

              <div className="rounded-2xl bg-white border border-rose-100/80 p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Packets Sold</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 block mt-0.5">
                  {todayStats.packets} <span className="text-xs font-bold text-zinc-500">pkts</span>
                </span>
                <span className="text-[10px] text-zinc-500">Total units booked</span>
              </div>

              <div className="rounded-2xl bg-white border border-rose-100/80 p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Orders Booked</span>
                <span className="text-xl sm:text-2xl font-black text-zinc-900 block mt-0.5">
                  {todayStats.orders} <span className="text-xs font-bold text-zinc-500">sales</span>
                </span>
                <span className="text-[10px] text-zinc-500">Retail store checkouts</span>
              </div>

              <div className="rounded-2xl bg-white border border-rose-100/80 p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Payment Split</span>
                <div className="mt-1 space-y-0.5 text-[11px] font-bold">
                  <div className="text-emerald-700">Cash: ₹{todayStats.cashRupees.toLocaleString("en-IN")}</div>
                  <div className="text-blue-700">UPI/Bank: ₹{todayStats.bankRupees.toLocaleString("en-IN")}</div>
                  {todayStats.pendingRupees > 0 && (
                    <div className="text-amber-700">Credit: ₹{todayStats.pendingRupees.toLocaleString("en-IN")}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Day-Wise Report Cards */}
          <SectionCard
            title="Daily Sales Ledger"
            description="Aggregated day-by-day sales volume, packet units, gross cash collection, and store receipts"
          >
            {loading && dailyGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin text-[#E61C5D] mb-2" />
                <p className="text-xs font-semibold">Loading daily sales report...</p>
              </div>
            ) : dailyGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500">
                <CalendarDays className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                <p className="text-xs font-semibold">No sales recorded yet. Start a shift or record a sale to see your daily breakdown.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyGroups.map((group: DailyGroup) => {
                  const isExpanded = Boolean(expandedDates[group.dateKey]);
                  return (
                    <div
                      key={group.dateKey}
                      className="rounded-2xl border border-zinc-200/90 bg-white overflow-hidden shadow-2xs transition"
                    >
                      {/* Day Header Row */}
                      <div className="p-4 bg-gradient-to-r from-zinc-50 via-white to-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-2xs ${
                            group.isToday
                              ? "bg-emerald-500 text-white"
                              : group.isYesterday
                              ? "bg-rose-100 text-[#E61C5D]"
                              : "bg-zinc-100 text-zinc-700"
                          }`}>
                            <CalendarDays className="h-5 w-5" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-zinc-950">{group.dayLabel}</h4>
                              {group.isToday && (
                                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5">
                                  Today
                                </span>
                              )}
                              {group.isYesterday && (
                                <span className="rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold px-2 py-0.5">
                                  Yesterday
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{group.formattedDate}</p>
                          </div>
                        </div>

                        {/* Day metrics summary */}
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                          <div className="rounded-xl bg-white border border-zinc-200/70 px-3 py-1.5 text-center shadow-2xs">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Sold</span>
                            <span className="font-mono text-xs font-black text-zinc-900">{group.totalPackets} pkts</span>
                          </div>

                          <div className="rounded-xl bg-white border border-zinc-200/70 px-3 py-1.5 text-center shadow-2xs">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Revenue</span>
                            <span className="font-mono text-xs font-black text-[#E61C5D]">
                              ₹{(group.totalPaise / 100).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="rounded-xl bg-white border border-zinc-200/70 px-3 py-1.5 text-center shadow-2xs">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Orders</span>
                            <span className="font-mono text-xs font-black text-zinc-800">{group.salesCount}</span>
                          </div>

                          <div className="hidden sm:flex flex-col text-[10px] text-zinc-600 font-semibold pl-1">
                            <span>Cash: ₹{(group.cashPaise / 100).toLocaleString("en-IN")}</span>
                            <span>UPI: ₹{(group.bankPaise / 100).toLocaleString("en-IN")}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleDateExpand(group.dateKey)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition shadow-2xs cursor-pointer ml-auto"
                          >
                            <span>{isExpanded ? "Hide" : "View"} Sales ({group.sales.length})</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Transactions for this day */}
                      {isExpanded && (
                        <div className="p-3 sm:p-4 bg-zinc-50/50 space-y-2.5">
                          {group.sales.map((s: SaleItem) => (
                            <div
                              key={s.id}
                              className="rounded-xl border border-zinc-200/80 bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-rose-200 transition"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#E61C5D]">
                                  <Store className="h-4 w-4" />
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-bold text-zinc-900">{s.customer?.shopName || "Customer Store"}</h5>
                                    <span className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold ${
                                      s.status === "CONFIRMED"
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : s.status === "PENDING_APPROVAL"
                                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                                        : "bg-rose-50 text-rose-800 border border-rose-200"
                                    }`}>
                                      {s.status === "CONFIRMED" ? "Confirmed" : s.status === "PENDING_APPROVAL" ? "Pending Approval" : "Rejected"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-500 mt-0.5">
                                    Contact: {s.customer?.contactName || "Owner"} &middot; {s.customer?.phone || ""}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                                <div className="text-left sm:text-right">
                                  <span className="font-mono text-xs font-black text-zinc-900 block">
                                    {s.quantity} pkts &middot; ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-medium">
                                    Mode: {s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "UPI/Bank" : "Pending"}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedSaleId(s.id)}
                                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs cursor-pointer"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      ) : (
        <>
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
            {/* MOBILE CARDS VIEW */}
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
                  const isPending = s.status === "PENDING_APPROVAL";
                  const isRejected = s.status === "REJECTED";
                  const diffHours = (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60);
                  const canEdit = (isPending || isRejected) && diffHours <= 48;

                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900">{s.customer?.shopName || "Retail Shop"}</h4>
                          <p className="text-xs text-zinc-500">{s.customer?.contactName || "Customer"}</p>
                        </div>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          isConfirmed
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : isPending
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}>
                          {isConfirmed ? "Confirmed" : isPending ? "Pending Review" : "Rejected"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Packets</span>
                          <span className="font-bold text-zinc-800">{s.quantity} units</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Amount</span>
                          <span className="font-bold text-[#E61C5D]">₹{(s.totalPaise / 100).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Payment</span>
                          <span className="font-semibold text-zinc-700">{s.paymentMode}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Date</span>
                          <span className="font-semibold text-zinc-700">{new Date(s.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleId(s.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{canEdit ? "Edit / Details" : "View Details"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200/80 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Customer / Shop</th>
                    <th className="py-3 px-3 text-right">Packets</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                    <th className="py-3 px-3 text-center">Payment</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Invoice</th>
                    <th className="py-3 pl-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {sales.map((s) => {
                    const isConfirmed = s.status === "CONFIRMED";
                    const isPending = s.status === "PENDING_APPROVAL";
                    const isRejected = s.status === "REJECTED";
                    const diffHours = (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60);
                    const canEdit = (isPending || isRejected) && diffHours <= 48;
                    const unitPrice = s.quantity > 0 ? (s.totalPaise / 100) / s.quantity : 25;

                    return (
                      <tr key={s.id} className="hover:bg-zinc-50/70 transition">
                        <td className="py-3 px-3 whitespace-nowrap text-zinc-600 font-mono text-[11px]">
                          {new Date(s.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-zinc-900 block truncate max-w-[180px]">{s.customer?.shopName || "Retail Shop"}</span>
                          <span className="text-[10px] text-zinc-500">{s.customer?.contactName || ""}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-zinc-900 font-mono">
                          {s.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-600 font-mono">
                          ₹{unitPrice.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-[#E61C5D] font-mono">
                          ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                            {s.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isConfirmed
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : isPending
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}>
                            {isConfirmed ? "Confirmed" : isPending ? "Pending Review" : "Rejected"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-zinc-500 font-mono text-[11px]">
                          {s.invoice?.number || "—"}
                        </td>
                        <td className="py-3 pl-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedSaleId(s.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs cursor-pointer"
                          >
                            <FileText className="h-3 w-3 text-zinc-500" />
                            <span>{canEdit ? "Edit" : "View"}</span>
                          </button>
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
        </>
      )}

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
