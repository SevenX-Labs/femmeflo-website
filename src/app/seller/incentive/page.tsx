"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Gift,
  HelpCircle,
  Loader2,
  Package,
  RefreshCw,
  Store,
  TrendingUp,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { SellerIncentiveData } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export default function SellerIncentivePage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const [data, setData] = useState<SellerIncentiveData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadIncentives = async () => {
    setLoading(true);
    try {
      const res = await sellerApi.getIncentives();
      setData(res);
    } catch (err) {
      console.error("Failed to load seller incentives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncentives();
  }, []);

  const summary = data?.summary ?? { totalPacketsSold: 0, totalIncentivePaise: 0, totalIncentiveRupees: 0 };
  const items = data?.items ?? [];

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Rewards & Commissions"
        title="My Incentive History"
        description="Transparent breakdown of all confirmed customer sales and earned incentive rewards, strictly calculated according to HQ business policy."
        action={
          <button
            onClick={loadIncentives}
            disabled={loading}
            title="Refresh incentive stats"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Earned Incentive"
          value={`₹${summary.totalIncentiveRupees.toLocaleString("en-IN")}`}
          note="Accrued from confirmed customer deliveries"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Eligible Packets Delivered"
          value={summary.totalPacketsSold.toLocaleString("en-IN")}
          note="Delivered & confirmed packet volume"
          icon="packages"
        />
        <MetricCard
          label="Current Policy Rate"
          value={items.length > 0 && items[0].incentiveRatePaise !== null ? `₹${(items[0].incentiveRatePaise / 100).toFixed(2)}/pkt` : "—"}
          note="Per-packet incentive rate applied"
          icon="rupee"
          tone="amber"
        />
      </div>

      {/* Detailed Incentive Ledger */}
      <SectionCard
        title="Confirmed Delivery Incentive Ledger"
        description="Every verified sale event, shopkeeper details, packet volume, locked incentive rate, and payout amount."
        className="mt-8"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="pb-3.5">Customer Shop</th>
                <th className="pb-3.5">Delivered Packets</th>
                <th className="pb-3.5">Incentive Rate</th>
                <th className="pb-3.5">Confirmed Date</th>
                <th className="pb-3.5 text-right">Earned Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((row) => (
                <tr key={row.saleId} className="transition hover:bg-zinc-50/60">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#156035]">
                        <Store className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-zinc-900">
                          {row.customer?.shopName || "Customer Shop"}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {row.customer?.contactName || "Shopkeeper"} · Sale #{row.saleId.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-semibold text-zinc-900">
                    {row.quantity} pkts
                  </td>
                  <td className="py-4 text-xs font-mono text-zinc-600">
                    {row.incentiveRatePaise === null ? "—" : `₹${(row.incentiveRatePaise / 100).toFixed(2)} / pkt`}
                  </td>
                  <td className="py-4 text-xs text-zinc-500">
                    {new Date(row.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-4 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-[#156035]">
                      ₹{(row.incentiveAmountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                    No confirmed incentive sales yet. Once field deliveries are verified, your rewards will appear here.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#E61C5D]" />
                      <span>Loading incentive history...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
