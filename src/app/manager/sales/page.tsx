"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  Loader2,
  LockKeyhole,
  Package,
  RefreshCw,
  Search,
  Store,
  User,
} from "lucide-react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import type { SaleItem } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";
import { canApproveSales } from "@/lib/permissions";
import dynamic from "next/dynamic";
const SaleDetailModal = dynamic(() =>
  import("@/components/management/SaleDetailModal").then((m) => ({ default: m.SaleDetailModal }))
);

interface DailyGroup {
  dateKey: string;
  dayLabel: string;
  formattedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  totalPackets: number;
  totalPaise: number;
  salesCount: number;
  officers: Set<string>;
  cashPaise: number;
  bankPaise: number;
  pendingPaise: number;
  confirmedCount: number;
  pendingCount: number;
  rejectedCount: number;
  sales: SaleItem[];
}

export default function ManagerSalesPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";
  const canSales = canApproveSales(user);

  const [viewMode, setViewMode] = useState<"DAILY_REPORT" | "TRANSACTIONS">("DAILY_REPORT");
  const [salesList, setSalesList] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    [new Date().toISOString().slice(0, 10)]: true,
  });

  const loadManagerSales = useCallback(async (manual = false) => {
    if (!canSales) return;
    if (manual) setIsRefreshing(true);
    else setLoading(true);
    try {
      const res = await managerApi.listSales({ pageSize: 100 });
      const items = res?.sales ?? (res as any)?.items ?? [];
      setSalesList(items);
    } catch (err) {
      console.warn("Failed loading manager sales:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [canSales]);

  useEffect(() => {
    loadManagerSales();
  }, [loadManagerSales]);

  const toggleDateExpand = (dateKey: string) => {
    setExpandedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const dailyGroups = useMemo<DailyGroup[]>(() => {
    const map: Record<string, DailyGroup> = {};
    const todayStr = new Date().toISOString().slice(0, 10);
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().slice(0, 10);

    salesList.forEach((s) => {
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
          officers: new Set<string>(),
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
      if (s.seller?.name) g.officers.add(s.seller.name);

      if (s.paymentMode === "CASH") g.cashPaise += s.totalPaise;
      else if (s.paymentMode === "BANK") g.bankPaise += s.totalPaise;
      else g.pendingPaise += s.totalPaise;

      if (s.status === "CONFIRMED") g.confirmedCount += 1;
      else if (s.status === "PENDING_APPROVAL") g.pendingCount += 1;
      else if (s.status === "REJECTED") g.rejectedCount += 1;

      g.sales.push(s);
    });

    return Object.values(map).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [salesList]);

  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayGroup = dailyGroups.find((g: DailyGroup) => g.dateKey === todayStr);
    return {
      revenue: (todayGroup?.totalPaise ?? 0) / 100,
      packets: todayGroup?.totalPackets ?? 0,
      orders: todayGroup?.salesCount ?? 0,
      officersCount: todayGroup?.officers.size ?? 0,
      cash: (todayGroup?.cashPaise ?? 0) / 100,
      bank: (todayGroup?.bankPaise ?? 0) / 100,
    };
  }, [dailyGroups]);

  const fetchSalesForResourceScreen = useCallback(async (): Promise<ResourceRow[]> => {
    if (!canSales) return [];
    const res = await managerApi.listSales({ pageSize: 100 });
    const sales = res?.sales ?? (res as any)?.items ?? [];
    return sales.map((s) => ({
      id: s.id,
      customer: s.customer?.shopName || "Retail Shop",
      seller: s.seller?.name || "Field Officer",
      packets: s.quantity.toString(),
      amount: "₹" + (s.totalPaise / 100).toLocaleString("en-IN"),
      payment: s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "Bank" : "Pending",
      date: new Date(s.createdAt).toLocaleDateString("en-IN"),
      rawDate: s.createdAt,
      status:
        s.status === "CONFIRMED"
          ? "Confirmed"
          : s.status === "PENDING_APPROVAL"
          ? "Approval required"
          : "Rejected",
      invoiceId: s.invoice?.id,
      invoiceNumber: s.invoice?.number,
    }));
  }, [canSales]);

  if (!canSales) {
    return (
      <DashboardShell
        role="Manager"
        workspace="Manager workspace"
        userName={userName}
        userDetail={userDetail}
        navigation={getManagerNavigation(user)}
      >
        <PageHeading
          eyebrow="Access control"
          title="Sales ledger"
          description="Review packet transactions from field officers in your territory."
        />
        <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Access Restricted</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Your Super Admin has not assigned sales approval or transaction auditing permissions to your account.
            If your role requires reviewing sales, contact your head office administrator.
          </p>
          <div className="mt-6">
            <Link
              href="/manager"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c91550] transition cursor-pointer"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <>
      {viewMode === "DAILY_REPORT" ? (
        <DashboardShell
          role="Manager"
          workspace="Manager workspace"
          userName={userName}
          userDetail={userDetail}
          navigation={getManagerNavigation(user)}
        >
          <PageHeading
            eyebrow="Territory performance & auditing"
            title="Daily Sales Report"
            description="Day-by-day aggregated packet sales, field officer activity, gross cash collections, and customer orders."
            action={
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => loadManagerSales(true)}
                  disabled={loading || isRefreshing}
                  title="Refresh report"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${(loading || isRefreshing) ? "animate-spin text-[#E61C5D]" : ""}`}
                  />
                </button>
              </div>
            }
          />

          {/* View Mode Toggle */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-zinc-100/90 p-1.5 rounded-2xl border border-zinc-200/80">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode("DAILY_REPORT")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer bg-white text-[#E61C5D] shadow-sm"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Daily Sales Report</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TRANSACTIONS")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer text-zinc-600 hover:text-zinc-900"
              >
                <Layers className="h-4 w-4" />
                <span>All Transactions Ledger ({salesList.length})</span>
              </button>
            </div>
            <div className="text-[11px] text-zinc-500 font-medium px-2">
              Territory day-by-day sales &amp; field officer summary
            </div>
          </div>

          {/* Today KPI Strip */}
          <div className="mt-6 rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50/60 via-white to-rose-50/40 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-rose-100/80 pb-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#E61C5D]" /> Today\'s Territory Performance
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 rounded-full px-2.5 py-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white border border-rose-100/80 p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Today\'s Sales</span>
                <span className="text-xl sm:text-2xl font-black text-[#E61C5D] block mt-0.5">
                  ₹{todayStats.revenue.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-zinc-500">Gross revenue</span>
              </div>

              <div className="rounded-2xl bg-white border border-rose-100/80 p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Packets Sold</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 block mt-0.5">
                  {todayStats.packets} <span className="text-xs font-bold text-zinc-500">pkts</span>
                </span>
                <span className="text-[10px] text-zinc-500">Territory units</span>
              </div>

              <div className="rounded-2xl bg-white border border-rose-100/80 p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Active Officers</span>
                <span className="text-xl sm:text-2xl font-black text-zinc-900 block mt-0.5">
                  {todayStats.officersCount} <span className="text-xs font-bold text-zinc-500">field officers</span>
                </span>
                <span className="text-[10px] text-zinc-500">Booked orders today</span>
              </div>

              <div className="rounded-2xl bg-white border border-rose-100/80 p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Payment Split</span>
                <div className="mt-1 space-y-0.5 text-[11px] font-bold">
                  <div className="text-emerald-700">Cash: ₹{todayStats.cash.toLocaleString("en-IN")}</div>
                  <div className="text-blue-700">UPI/Bank: ₹{todayStats.bank.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Reports Cards */}
          <SectionCard
            title="Day-wise Territory Sales History"
            description="Aggregated packets, gross cash collections, and active field officers by date"
            className="mt-6"
          >
            {loading && dailyGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin text-[#E61C5D] mb-2" />
                <p className="text-xs font-semibold">Loading daily sales report...</p>
              </div>
            ) : dailyGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500">
                <CalendarDays className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                <p className="text-xs font-semibold">No territory sales records found.</p>
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
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Packets</span>
                            <span className="font-mono text-xs font-black text-zinc-900">{group.totalPackets} pkts</span>
                          </div>

                          <div className="rounded-xl bg-white border border-zinc-200/70 px-3 py-1.5 text-center shadow-2xs">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Total Revenue</span>
                            <span className="font-mono text-xs font-black text-[#E61C5D]">
                              ₹{(group.totalPaise / 100).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="rounded-xl bg-white border border-zinc-200/70 px-3 py-1.5 text-center shadow-2xs">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Officers</span>
                            <span className="font-mono text-xs font-black text-zinc-800">{group.officers.size}</span>
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
                                    Officer: <strong className="text-zinc-700">{s.seller?.name || "Field Officer"}</strong> &middot; Contact: {s.customer?.contactName || "Owner"}
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
        </DashboardShell>
      ) : (
        <div className="relative">
          {/* View mode toggle above ResourceListScreen */}
          <div className="bg-zinc-100 border-b border-zinc-200 px-4 sm:px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode("DAILY_REPORT")}
                className="inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer text-zinc-600 hover:text-zinc-900"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Daily Sales Report</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TRANSACTIONS")}
                className="inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer bg-white text-[#E61C5D] shadow-2xs"
              >
                <Layers className="h-4 w-4" />
                <span>All Transactions</span>
              </button>
            </div>
            <span className="text-xs text-zinc-500 font-medium hidden sm:inline">Transaction-level audit</span>
          </div>

          <ResourceListScreen
            role="Manager"
            workspace="Manager workspace"
            userName={userName}
            userDetail={userDetail}
            navigation={getManagerNavigation(user)}
            eyebrow="Territory sales"
            title="Sales ledger"
            description="Review all packet transactions from field officers and customers in your assigned territory. Track confirmed deliveries, pending approvals, and payment status."
            primaryAction="Export sales"
            searchPlaceholder="Search by customer, officer, or status"
            columns={[
              { key: "customer", label: "Customer" },
              { key: "seller", label: "Field Officer" },
              { key: "packets", label: "Packets" },
              { key: "amount", label: "Amount" },
              { key: "payment", label: "Payment mode" },
              { key: "date", label: "Date" },
              { key: "status", label: "Status" },
            ]}
            fetchData={fetchSalesForResourceScreen}
          />
        </div>
      )}

      {/* Sale Detail Modal */}
      {selectedSaleId && (
        <SaleDetailModal
          role="Manager"
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          onSaleUpdated={() => loadManagerSales(true)}
        />
      )}
    </>
  );
}
