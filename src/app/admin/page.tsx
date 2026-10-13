"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  Layers,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboardData } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export default function AdminOverviewDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboard();
      setData(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Backend unavailable";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics ?? {
    totalPacketsSold: 0,
    totalEarningsPaise: 0,
    totalEarningsRupees: 0,
    totalStates: 0,
    totalShops: 0,
    totalManagers: 0,
    totalSellers: 0,
    totalInventory: 0,
    hqStock: 0,
    warehouseStock: 0,
    sellerStock: 0,
    totalIncentivePaise: 0,
    totalIncentiveRupees: 0,
  };
  const { user } = useAuth();

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName={user?.name ?? "Super Admin"}
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Operations command"
        title="Admin overview"
        description="Live operational metrics across HQ inventory, regional warehouses, assigned managers, active sellers, and field retail coverage."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              title="Refresh dashboard metrics"
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
          <span>Unable to load live dashboard metrics. ({error})</span>
          <button onClick={fetchDashboard} className="underline hover:text-amber-950 font-bold">
            Retry connection
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={`₹${metrics.totalEarningsRupees.toLocaleString("en-IN")}`}
          note="Confirmed sales across network"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Packets Sold"
          value={metrics.totalPacketsSold.toLocaleString("en-IN")}
          note="Confirmed field distribution"
          icon="packages"
          tone="rose"
        />
        <MetricCard
          label="Total Inventory"
          value={metrics.totalInventory.toLocaleString("en-IN")}
          note="HQ, warehouses & sellers"
          icon="package"
          tone="amber"
        />
        <MetricCard
          label="Active Sellers"
          value={metrics.totalSellers.toString()}
          note={`Supervised by ${metrics.totalManagers} managers`}
          icon="chart"
          tone="green"
        />
      </div>

      {/* Stock Distribution by Level */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Stock by echelon"
          description="Physical inventory position from central to field"
          className="lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-[#E61C5D] shadow-sm">
                  <Layers className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">HQ Central</span>
              </div>
              <p className="mt-4 font-playfair text-3xl font-bold text-zinc-900">
                {metrics.hqStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Packets in central warehouse</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-amber-600 shadow-sm">
                  <Package className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Regional Depots</span>
              </div>
              <p className="mt-4 font-playfair text-3xl font-bold text-zinc-900">
                {metrics.warehouseStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Packets in district storage</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-[#156035] shadow-sm">
                  <PackageCheck className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Seller Handover</span>
              </div>
              <p className="mt-4 font-playfair text-3xl font-bold text-zinc-900">
                {metrics.sellerStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Packets ready for retail</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t border-zinc-100 pt-5">
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-[#E61C5D] hover:underline"
            >
              View detailed stock reconciliation &rarr;
            </Link>
            <span className="text-zinc-300">·</span>
            <Link
              href="/admin/inventory/transfers"
              className="text-xs font-bold text-[#156035] hover:underline"
            >
              Transfer packets between depots &rarr;
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Field footprint"
          description="Retail coverage and seller incentive"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-emerald-50 p-2.5 text-[#156035]">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Retailers / Shops</p>
                  <p className="text-xs text-zinc-400">Onboarded customer accounts</p>
                </div>
              </div>
              <span className="font-playfair text-xl font-bold text-[#156035]">
                {metrics.totalShops}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-rose-50 p-2.5 text-[#E61C5D]">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Field Sellers</p>
                  <p className="text-xs text-zinc-400">Active distribution agents</p>
                </div>
              </div>
              <span className="font-playfair text-xl font-bold text-[#E61C5D]">
                {metrics.totalSellers}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Incentives Earned</p>
                  <p className="text-xs text-zinc-400">Calculated on confirmed sales</p>
                </div>
              </div>
              <span className="font-playfair text-xl font-bold text-amber-700">
                ₹{metrics.totalIncentiveRupees.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Quick Action Navigation Grid */}
      <SectionCard
        title="Operations modules"
        description="Direct shortcuts to core business processes"
        className="mt-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Link
            href="/admin/approvals"
            className="group flex flex-col justify-between rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div>
              <span className="inline-flex rounded-xl bg-white p-2.5 text-[#E61C5D] shadow-sm group-hover:scale-105 transition-transform">
                <Clock3 className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-zinc-900">Approvals</h3>
              <p className="mt-1 text-xs text-zinc-500">Review low-price packet sales</p>
            </div>
            <span className="mt-4 text-xs font-bold text-[#E61C5D]">Open queue &rarr;</span>
          </Link>

          <Link
            href="/admin/sales"
            className="group flex flex-col justify-between rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div>
              <span className="inline-flex rounded-xl bg-white p-2.5 text-[#156035] shadow-sm group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-zinc-900">Sales ledger</h3>
              <p className="mt-1 text-xs text-zinc-500">Audit confirmed and pending transactions</p>
            </div>
            <span className="mt-4 text-xs font-bold text-[#156035]">View sales &rarr;</span>
          </Link>

          <Link
            href="/admin/invoices"
            className="group flex flex-col justify-between rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div>
              <span className="inline-flex rounded-xl bg-white p-2.5 text-zinc-700 shadow-sm group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-zinc-900">Invoices</h3>
              <p className="mt-1 text-xs text-zinc-500">Track delivery by Email & WhatsApp</p>
            </div>
            <span className="mt-4 text-xs font-bold text-zinc-700">Check invoices &rarr;</span>
          </Link>

          <Link
            href="/admin/reports"
            className="group flex flex-col justify-between rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div>
              <span className="inline-flex rounded-xl bg-white p-2.5 text-amber-700 shadow-sm group-hover:scale-105 transition-transform">
                <MapPin className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-zinc-900">Territory reports</h3>
              <p className="mt-1 text-xs text-zinc-500">Export CSV / JSON performance logs</p>
            </div>
            <span className="mt-4 text-xs font-bold text-amber-700">Explore reports &rarr;</span>
          </Link>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
