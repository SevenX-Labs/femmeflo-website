"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LockKeyhole, PackageCheck, RefreshCw, Truck, Users } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import { useAuth } from "@/context/AuthContext";
import { canViewInventory } from "@/lib/permissions";

interface SellerStockRow {
  seller: {
    id: string;
    name: string;
    village?: string | null;
  };
  assigned: number;
  sold: number;
  remaining: number;
}

export default function ManagerInventoryPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";
  const canInventory = canViewInventory(user);

  const [summary, setSummary] = useState({ totalAssigned: 0, totalSold: 0, totalRemaining: 0 });
  const [sellers, setSellers] = useState<SellerStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = async () => {
    if (!canInventory) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await managerApi.getInventory();
      setSummary(res?.summary ?? { totalAssigned: 0, totalSold: 0, totalRemaining: 0 });
      setSellers(res?.sellers ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backend unavailable";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canInventory) {
      loadInventory();
    } else {
      setLoading(false);
    }
  }, [canInventory]);

  if (!canInventory) {
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
          title="Territory stock"
          description="Monitor seller allocations and remaining packets in your jurisdiction."
        />
        <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Access Restricted</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Your Super Admin has not assigned inventory viewing permissions to your account.
            If your role requires monitoring field stock balances, contact your head office administrator.
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
    <DashboardShell
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={getManagerNavigation(user)}
    >
      <PageHeading
        eyebrow="Assigned inventory"
        title="Territory stock"
        description="Monitor seller allocations, confirmed sales, and remaining packets in your assigned territory jurisdiction."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadInventory}
              disabled={loading}
              title="Refresh stock data"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550]">
              <Truck className="h-4 w-4" /> Request stock
            </button>
          </div>
        }
      />

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <span>Unable to load live territory stock. ({error})</span>
          <button onClick={loadInventory} className="underline hover:text-amber-950 font-bold">Retry</button>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Allocated"
          value={(summary?.totalAssigned ?? 0).toLocaleString("en-IN")}
          note="Packets assigned to your officers"
          icon="packages"
        />
        <MetricCard
          label="Confirmed Sold"
          value={(summary?.totalSold ?? 0).toLocaleString("en-IN")}
          note="Packets delivered and verified"
          icon="packages"
          tone="green"
        />
        <MetricCard
          label="Remaining In Field"
          value={(summary?.totalRemaining ?? 0).toLocaleString("en-IN")}
          note="Ready for retail delivery"
          icon="packages"
          tone="amber"
        />
      </div>

      {/* Seller-wise Stock Table */}
      <SectionCard
        title="Field Officer Stock Position"
        description="Stock balance and sales progress across your assigned officers"
        className="mt-8"
      >
        {/* MOBILE OFFICER CARDS (under 640px) */}
        <div className="sm:hidden space-y-3">
          {sellers.map((seller) => {
            const utilization = seller.assigned > 0
              ? Math.round((seller.sold / seller.assigned) * 100)
              : 0;

            return (
              <div
                key={`m-${seller.seller.id}`}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-xl bg-rose-50 p-2 text-[#E61C5D]">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950">{seller.seller.name}</h4>
                      <span className="text-xs text-zinc-600 block mt-0.5">
                        {seller.seller.village || "Territory"}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    seller.remaining > 50
                      ? "bg-amber-50 text-amber-700"
                      : seller.remaining > 10
                      ? "bg-emerald-50 text-[#157347]"
                      : "bg-rose-50 text-[#E61C5D]"
                  }`}>
                    {seller.remaining} pkts in hand
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 pt-2.5">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">
                      Allocated
                    </span>
                    <span className="font-semibold text-zinc-800 text-xs block mt-0.5">
                      {seller.assigned.toLocaleString("en-IN")} pkts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">
                      Confirmed Sold
                    </span>
                    <span className="font-bold text-[#156035] text-xs block mt-0.5">
                      {seller.sold.toLocaleString("en-IN")} pkts
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[11px] font-medium text-zinc-500">Utilization Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-rose-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#E61C5D]"
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-800">{utilization}%</span>
                  </div>
                </div>
              </div>
            );
          })}
          {sellers.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-500">
              No field officer stock data available in your territory.
            </p>
          )}
        </div>

        {/* DESKTOP TABLE VIEW (640px and up) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead className="bg-[#FFF8FA] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700">
              <tr>
                <th className="px-4 py-4">Seller</th>
                <th className="px-4 py-4">Village</th>
                <th className="px-4 py-4">Total Allocated</th>
                <th className="px-4 py-4">Confirmed Sold</th>
                <th className="px-4 py-4">Current Balance</th>
                <th className="px-4 py-4">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sellers.map((seller) => {
                const utilization = seller.assigned > 0
                  ? Math.round((seller.sold / seller.assigned) * 100)
                  : 0;
                return (
                  <tr key={seller.seller.id} className="hover:bg-[#FFFDFD]">
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-3">
                        <span className="rounded-xl bg-rose-50 p-2 text-[#E61C5D]">
                          <Users className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-bold text-zinc-800">{seller.seller.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-800">
                      {seller.seller.village || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-zinc-700">
                      {seller.assigned.toLocaleString("en-IN")} pkts
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-[#156035]">
                      {seller.sold.toLocaleString("en-IN")} pkts
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        seller.remaining > 50
                          ? "bg-amber-50 text-amber-700"
                          : seller.remaining > 10
                          ? "bg-emerald-50 text-[#157347]"
                          : "bg-rose-50 text-[#E61C5D]"
                      }`}>
                        {seller.remaining} pkts
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-rose-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#E61C5D]"
                            style={{ width: `${Math.min(100, utilization)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-zinc-800">{utilization}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sellers.length === 0 && (
            <p className="py-12 text-center text-sm text-zinc-700">
              No seller stock data available in your territory.
            </p>
          )}
        </div>
      </SectionCard>

      {/* Stock Movement Note */}
      <SectionCard
        title="Stock movement info"
        description="How packet allocation works in your territory"
        className="mt-6"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Truck className="h-5 w-5" />,
              title: "Depot → Seller",
              desc: "Admin transfers packets from HQ or warehouses to seller custody in your territory.",
              color: "text-[#E61C5D] bg-rose-50",
            },
            {
              icon: <PackageCheck className="h-5 w-5" />,
              title: "Seller → Customer",
              desc: "Sellers record sales to retail shops. Each sale deducts from their physical balance.",
              color: "text-[#156035] bg-emerald-50",
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "Manager oversight",
              desc: "You can see all assigned packets and confirmed sales across your supervised sellers.",
              color: "text-amber-700 bg-amber-50",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-zinc-100 p-5">
              <span className={`inline-flex rounded-xl p-2.5 ${item.color}`}>{item.icon}</span>
              <h3 className="mt-4 text-sm font-bold text-zinc-800">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-800">{item.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}