"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
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
import { managerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import type { ManagerDashboardData, SaleItem, SellerItem } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export default function ManagerOverviewDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [sellersList, setSellersList] = useState<SellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, salesRes, sellersRes] = await Promise.all([
        managerApi.getDashboard(),
        managerApi.listSales({ pageSize: 5 }).catch(() => ({ sales: [] as SaleItem[] })),
        managerApi.listSellers({ pageSize: 5 }).catch(() => ({ sellers: [] as SellerItem[] })),
      ]);
      setData(dashRes);
      setRecentSales(salesRes?.sales ?? []);
      setSellersList(sellersRes?.sellers ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backend unavailable";
      setError(msg);
    } finally {
      setLoading(false);
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
      navigation={managerNavigation}
    >
      <PageHeading
        eyebrow="Territory management"
        title="Manager overview"
        description="Monitor seller performance, retail customer relationships, confirmed packet sales, and remaining physical inventory in your assigned territory."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              title="Refresh territory metrics"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <Link
              href="/manager/customers/new"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-[#E61C5D] shadow-sm transition hover:bg-rose-50"
            >
              <Store className="h-4 w-4" /> Add customer
            </Link>
            <Link
              href="/manager/sellers/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550]"
            >
              <Plus className="h-4 w-4" /> Add seller
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <span>Unable to load live territory data. ({error})</span>
          <button onClick={fetchDashboard} className="underline hover:text-amber-950 font-bold">
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
          label="Assigned Sellers"
          value={metrics.totalSellers.toString()}
          note="Active in your jurisdiction"
          icon="chart"
          tone="green"
        />
        <MetricCard
          label="Remaining Stock"
          value={`${metrics.totalRemainingStock.toLocaleString("en-IN")} pkts`}
          note="Packets in seller hands"
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
            <Link href="/manager/sales" className="text-xs font-bold text-[#E61C5D] hover:underline">
              View all sales &rarr;
            </Link>
          }
        >
          <div className="space-y-3">
            {recentSales && recentSales.length > 0 ? (
              recentSales.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-[#FFFDFD]"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-rose-50 p-2 text-[#E61C5D]">
                      <ReceiptIndianRupee className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">
                        {s.customer?.shopName || "Customer Store"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        by {s.seller?.name || "Seller"} · {s.quantity} pkts ·{" "}
                        <span className="font-semibold text-zinc-600">
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
              <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400">
                No territory sales recorded yet. Sellers will log sales from the field.
              </div>
            )}
          </div>
        </SectionCard>

        {/* Assigned Sellers Team */}
        <SectionCard
          title="Assigned sellers team"
          description="Field agents onboarding customers and distributing stock"
          action={
            <Link href="/manager/sellers" className="text-xs font-bold text-[#E61C5D] hover:underline">
              View all sellers &rarr;
            </Link>
          }
        >
          <div className="space-y-3">
            {sellersList && sellersList.length > 0 ? (
              sellersList.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-emerald-50 p-2 text-[#156035]">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">{s.name}</p>
                      <p className="text-xs text-zinc-400">
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
                        s.active ? "bg-emerald-50 text-[#156035]" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400">
                No sellers assigned yet. Click &quot;Add seller&quot; to onboard field agents.
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
                  <p className="text-xs text-zinc-400">Pharmacies, medicals &amp; general stores</p>
                </div>
              </div>
              <span className="font-playfair text-2xl font-bold text-[#156035]">
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
                  <p className="text-xs text-zinc-400">Field sales agents reporting to you</p>
                </div>
              </div>
              <span className="font-playfair text-2xl font-bold text-[#E61C5D]">
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
                  <p className="text-xs text-zinc-400">Ready for instant sale in territory</p>
                </div>
              </div>
              <span className="font-playfair text-2xl font-bold text-amber-700">
                {metrics.totalRemainingStock} pkts
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Territory management links" description="Direct operations shortcuts">
          <div className="space-y-3">
            <Link
              href="/manager/sellers"
              className="flex items-center justify-between rounded-xl border border-rose-100 bg-[#FFF8FA] p-4 transition hover:bg-rose-50"
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-[#E61C5D]" />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Manage Sellers</p>
                  <p className="text-xs text-zinc-400">Onboard sellers &amp; review activity</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#E61C5D]">View team &rarr;</span>
            </Link>

            <Link
              href="/manager/customers"
              className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <Store className="h-4 w-4 text-[#156035]" />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Territory Customers</p>
                  <p className="text-xs text-zinc-400">Review retail store accounts &amp; categories</p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-600">Explore &rarr;</span>
            </Link>

            <Link
              href="/manager/inventory"
              className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <PackageCheck className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Reconcile Stock</p>
                  <p className="text-xs text-zinc-400">Audit seller allocations and sold packets</p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-600">Audit &rarr;</span>
            </Link>

            <Link
              href="/manager/sales"
              className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Territory Sales Ledger</p>
                  <p className="text-xs text-zinc-400">Review all confirmed &amp; pending transactions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-600">Ledger &rarr;</span>
            </Link>
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
