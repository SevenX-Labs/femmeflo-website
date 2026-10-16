"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { SellerIncentiveData } from "@/lib/api/types";

export default function SellerIncentivePage() {
  const [data, setData] = useState<SellerIncentiveData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadIncentives = async () => {
    setLoading(true);
    try {
      const res = await sellerApi.getIncentives();
      setData(res);
    } catch {
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
      userName="Seller"
      userDetail="Assigned territory"
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Incentive"
        title="Your incentive"
        description="Incentive rewards are computed exclusively on confirmed packet deliveries. Business rates are set centrally by operations policy."
        action={
          <button
            onClick={loadIncentives}
            disabled={loading}
            title="Refresh incentive stats"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:border-rose-200 hover:text-[#E61C5D]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
          </button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Incentive"
          value={`₹${summary.totalIncentiveRupees}`}
          note="Accrued from confirmed sales"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Eligible Packets"
          value={summary.totalPacketsSold.toString()}
          note="Delivered and verified"
          icon="packages"
        />
        <MetricCard
          label="Rate per Packet"
          value={items.length > 0 && items[0].incentiveRatePaise !== null ? `₹${items[0].incentiveRatePaise / 100}` : "—"}
          note="Rate captured on confirmed sales"
          icon="rupee"
          tone="amber"
        />
      </div>

      <SectionCard title="Incentive history" description="Confirmed delivery periods contributing to payout" className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 text-left">
            <thead className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700">
              <tr>
                <th className="pb-3">Period</th>
                <th className="pb-3">Packets</th>
                <th className="pb-3">Rate</th>
                <th className="pb-3">Total reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((row) => (
                <tr key={row.saleId}>
                  <td className="py-4 text-sm font-bold text-zinc-700">{new Date(row.date).toLocaleDateString("en-IN")}</td>
                  <td className="py-4 text-sm text-zinc-800">{row.quantity} pkts</td>
                  <td className="py-4 text-sm text-zinc-800">{row.incentiveRatePaise === null ? "—" : `₹${row.incentiveRatePaise / 100}`}</td>
                  <td className="py-4 text-sm font-bold text-[#156035]">₹{row.incentiveAmountPaise / 100}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-sm text-zinc-700">No confirmed incentive records.</td></tr>}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}