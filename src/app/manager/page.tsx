"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  LockKeyhole,
  PackageCheck,
  Plus,
  ReceiptIndianRupee,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { clearApiCache } from "@/lib/api/client";
import { managerApi } from "@/lib/api/manager";
import type { ManagerDashboardData, SaleItem, SellerItem } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";
import {
  canApproveSales,
  canManageSellers,
  canOnboardCustomers,
  canViewCustomers,
  canViewInventory,
} from "@/lib/permissions";

import { registerSessionCache } from "@/lib/api/sessionCaches";

// Persistent cache for manager dashboard
let cachedManagerDashboard: ManagerDashboardData | null = null;
let cachedManagerSales: SaleItem[] = [];
let cachedManagerSellers: SellerItem[] = [];

registerSessionCache(() => {
  cachedManagerDashboard = null;
  cachedManagerSales = [];
  cachedManagerSellers = [];
});

export default function ManagerOverviewDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(cachedManagerDashboard);
  const [recentSales, setRecentSales] = useState<SaleItem[]>(cachedManagerSales);
  const [sellersList, setSellersList] = useState<SellerItem[]>(cachedManagerSellers);
  const [loading, setLoading] = useState(!cachedManagerDashboard);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();

  const canSales = canApproveSales(user);
  const canManage = canManageSellers(user);
  const canCustomers = canViewCustomers(user) || canOnboardCustomers(user);
  const canInventory = canViewInventory(user);
  const canOnboard = canOnboardCustomers(user);

  const fetchDashboard = async (isManual = false) => {
    if (isManual || !cachedManagerDashboard) {
      if (cachedManagerDashboard) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
    }
    setError(null);
    try {
      // Refresh current user session permissions from backend
      const refreshed = await refreshUser().catch(() => user);
      const activeUser = refreshed || user;

      const salesPromise = canApproveSales(activeUser)
        ? managerApi.listSales({ pageSize: 5 }).catch(() => ({ sales: [] as SaleItem[] }))
        : Promise.resolve({ sales: [] as SaleItem[] });

      const sellersPromise = canManageSellers(activeUser)
        ? managerApi.listSellers({ pageSize: 5 }).catch(() => ({ sellers: [] as SellerItem[] }))
        : Promise.resolve({ sellers: [] as SellerItem[] });

      const [dashRes, salesRes, sellersRes] = await Promise.all([
        managerApi.getDashboard().catch(() => null),
        salesPromise,
        sellersPromise,
      ]);

      if (dashRes) {
        setData(dashRes);
        cachedManagerDashboard = dashRes;
      }
      const sales = salesRes?.sales ?? [];
      const sellers = sellersRes?.sellers ?? [];
      setRecentSales(sales);
      setSellersList(sellers);
      cachedManagerSales = sales;
      cachedManagerSellers = sellers;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backend unavailable";
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics ?? {
    totalSellers: 0,
    totalCustomers: 0,
    totalPacketsSold: 0,
    totalEarningsPaise: 0,
    totalEarningsRupees: 0,
    totalRemainingStock: 0,
  };

  const territoryLabel =
    [user?.district, user?.state].filter(Boolean).join(", ") || "Assigned territory";

  return (
    <DashboardShell
      role="Manager"
      workspace="Manager workspace"
      userName={user?.name ?? "Manager"}
      userDetail={territoryLabel}
      navigation={getManagerNavigation(user)}
    >
      <PageHeading
        eyebrow="Territory management"
        title="Manager overview"
        description="Monitor seller performance, retail customer relationships, confirmed packet sales, and remaining physical inventory in your assigned territory."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                clearApiCache();
                cachedManagerDashboard = null;
                fetchDashboard(true);
              }}
              disabled={loading || isRefreshing}
              title="Refresh territory metrics"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            {canOnboard && (
              <Link
                href="/manager/customers/new"
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-[#E61C5D] shadow-sm transition hover:bg-rose-50"
              >
                <Store className="h-4 w-4" /> Add customer
              </Link>
            )}
            {canManage && (
              <Link
                href="/manager/sellers/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550]"
              >
                <Plus className="h-4 w-4" /> Add officer
              </Link>
            )}
          </div>
        }
      />

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <span>Unable to load live territory data. ({error})</span>
          <button onClick={() => fetchDashboard(true)} className="underline hover:text-amber-950 font-bold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Territory Revenue"
          value={`₹${metrics.totalEarningsRupees.toLocaleString("en-IN")}`}
          note="Confirmed field sales"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Packets Sold"
          value={metrics.totalPacketsSold.toLocaleString("en-IN")}
          note="Delivered to retail customers"
          icon="packages"
          tone="rose"
        />
        <MetricCard
          label="Assigned Field Officers"
          value={metrics.totalSellers.toString()}
          note="Active in your jurisdiction"
          icon="chart"
          tone="green"
        />
        <MetricCard
          label="Remaining Stock"
          value={`${metrics.totalRemainingStock.toLocaleString("en-IN")} pkts`}
          note="Packets with field officers"
          icon="package"
          tone="amber"
        />
      </div>

      {/* Main Grid: Recent Sales & Sellers Team */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Territory Sales */}
        <SectionCard
          title="Recent territory sales"
          description="Latest packet transactions recorded in your jurisdiction"
          action={
            canSales ? (
              <Link href="/manager/sales" className="text-xs font-bold text-[#E61C5D] hover:underline">
                View all sales &rarr;
              </Link>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {!canSales ? (
              <div className="rounded-xl border border-dashed border-zinc-200 py-8 px-4 text-center">
                <LockKeyhole className="h-5 w-5 mx-auto mb-2 text-zinc-400" />
                <p className="text-xs font-bold text-zinc-700">Sales Ledger Access Not Granted</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Super Admin has not assigned sales verification permissions to your account.
                </p>
              </div>
            ) : recentSales && recentSales.length > 0 ? (
              recentSales.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-zinc-100 p-4 transition hover:bg-[#FFFDFD]"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-rose-50 p-2 text-[#E61C5D]">
                      <ReceiptIndianRupee className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">
                        {s.customer?.shopName || "Customer Store"}
                      </p>
                      <p className="text-xs text-zinc-700">
                        by {s.seller?.name || "Seller"} · {s.quantity} pkts ·{" "}
                        <span className="font-semibold text-zinc-900">
                          {s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "Bank" : "Pending"}
                        </span>{" "}
                        · {new Date(s.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#156035]">
                      ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.status === "CONFIRMED"
                          ? "bg-emerald-50 text-[#157347]"
                          : s.status === "PENDING_APPROVAL"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-[#E61C5D]"
                      }`}
                    >
                      {s.status === "CONFIRMED"
                        ? "Confirmed"
                        : s.status === "PENDING_APPROVAL"
                        ? "Pending approval"
                        : "Rejected"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-700">
                No territory sales recorded yet. Sellers will log sales from the field.
              </div>
            )}
          </div>
        </SectionCard>

        {/* Assigned Field Officers Team */}
        <SectionCard
          title="Assigned Field Officers"
          description="Field officers onboarding retail stores and distributing stock"
          action={
            canManage ? (
              <Link href="/manager/sellers" className="text-xs font-bold text-[#E61C5D] hover:underline">
                View all officers &rarr;
              </Link>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {!canManage ? (
              <div className="rounded-xl border border-dashed border-zinc-200 py-8 px-4 text-center">
                <LockKeyhole className="h-5 w-5 mx-auto mb-2 text-zinc-400" />
                <p className="text-xs font-bold text-zinc-700">Field Officer Supervision Not Granted</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Super Admin has not assigned officer onboarding and management permissions to your account.
                </p>
              </div>
            ) : sellersList && sellersList.length > 0 ? (
              sellersList.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-emerald-50 p-2 text-[#156035]">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">{s.name}</p>
                      <p className="text-xs text-zinc-700">
                        {[s.village, s.district].filter(Boolean).join(", ") || "Territory"} ·{" "}
                        {s._count?.customers ?? 0} customers onboarded
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-800">
                      {s.stockLocation?.balance ?? 0} pkts
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.active ? "bg-emerald-50 text-[#156035]" : "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-700">
                No officers assigned yet. Click &quot;Add officer&quot; to onboard field personnel.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Territory Reach & Quick Operations */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Customer & retail reach"
          description="Coverage across your territory villages and retail accounts"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-emerald-50 p-2.5 text-[#156035]">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Total Customer Stores</p>
                  <p className="text-xs text-zinc-700">Pharmacies, medicals &amp; general stores</p>
                </div>
              </div>
              <span className="text-2xl font-bold font-sans tracking-tight text-[#156035]">
                {metrics.totalCustomers}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-rose-50 p-2.5 text-[#E61C5D]">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Assigned Sellers</p>
                  <p className="text-xs text-zinc-700">Field officers reporting to you</p>
                </div>
              </div>
              <span className="text-2xl font-bold font-sans tracking-tight text-[#E61C5D]">
                {metrics.totalSellers}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                  <Truck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Stock in Field</p>
                  <p className="text-xs text-zinc-700">Ready for instant sale in territory</p>
                </div>
              </div>
              <span className="text-2xl font-bold font-sans tracking-tight text-amber-700">
                {metrics.totalRemainingStock} pkts
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Territory management links" description="Direct operations shortcuts">
          <div className="space-y-3">
            {canManage ? (
              <Link
                href="/manager/sellers"
                className="flex items-center justify-between rounded-xl border border-rose-100 bg-[#FFF8FA] p-4 transition hover:bg-rose-50"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-[#E61C5D]" />
                  <div>
                    <p className="text-sm font-bold text-zinc-800">Manage Field Officers</p>
                    <p className="text-xs text-zinc-700">Onboard officers &amp; review activity</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#E61C5D]">View team &rarr;</span>
              </Link>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 opacity-75">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-bold text-zinc-600">Field Officers</p>
                    <p className="text-xs text-zinc-400">Permission not granted by Admin</p>
                  </div>
                </div>
                <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">Locked</span>
              </div>
            )}

            {canCustomers ? (
              <Link
                href="/manager/customers"
                className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
              >
                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-[#156035]" />
                  <div>
                    <p className="text-sm font-bold text-zinc-800">Territory Customers</p>
                    <p className="text-xs text-zinc-700">Review retail store accounts &amp; categories</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-900">Explore &rarr;</span>
              </Link>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 opacity-75">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-bold text-zinc-600">Territory Customers</p>
                    <p className="text-xs text-zinc-400">Permission not granted by Admin</p>
                  </div>
                </div>
                <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">Locked</span>
              </div>
            )}

            {canInventory ? (
              <Link
                href="/manager/inventory"
                className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
              >
                <div className="flex items-center gap-3">
                  <PackageCheck className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-zinc-800">Reconcile Stock</p>
                    <p className="text-xs text-zinc-700">Audit seller allocations and sold packets</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-900">Audit &rarr;</span>
              </Link>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 opacity-75">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-bold text-zinc-600">Stock Reconciliation</p>
                    <p className="text-xs text-zinc-400">Permission not granted by Admin</p>
                  </div>
                </div>
                <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">Locked</span>
              </div>
            )}

            {canSales ? (
              <Link
                href="/manager/sales"
                className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-zinc-800">Territory Sales Ledger</p>
                    <p className="text-xs text-zinc-700">Review all confirmed &amp; pending transactions</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-900">Ledger &rarr;</span>
              </Link>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 opacity-75">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-bold text-zinc-600">Sales Ledger</p>
                    <p className="text-xs text-zinc-400">Permission not granted by Admin</p>
                  </div>
                </div>
                <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">Locked</span>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
