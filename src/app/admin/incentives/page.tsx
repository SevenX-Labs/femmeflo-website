"use client";

import { useEffect, useState } from "react";
import { DollarSign, IndianRupee, Loader2, PackageCheck, RefreshCw } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { BusinessSettings, IncentiveSummaryItem } from "@/lib/api/types";

export default function AdminIncentivesPage() {
  const [incentives, setIncentives] = useState<IncentiveSummaryItem[]>([]);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [totalIncentive, setTotalIncentive] = useState(0);
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRate, setNewRate] = useState("15");
  const [savingRate, setSavingRate] = useState(false);
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, setRes] = await Promise.all([
        adminApi.getIncentives().catch(() => null),
        adminApi.getIncentiveSettings().catch(() => null),
      ]);

      if (incRes) {
        const sellers = incRes.sellers ?? (incRes as any).items ?? [];
        const rows: IncentiveSummaryItem[] = sellers.map((item) => ({
          sellerId: item.seller.id,
          sellerName: item.seller.name,
          territory: item.seller.phone ?? "",
          confirmedPackets: item.totalConfirmedPackets,
          ratePerPacketPaise: incRes.currentRatePaise ?? 0,
          ratePerPacketRupees: (incRes.currentRatePaise ?? 0) / 100,
          totalIncentivePaise: item.totalIncentivePaise,
          totalIncentiveRupees: item.totalIncentiveRupees,
        }));
        setIncentives(rows);
        setTotalConfirmed(rows.reduce((sum, item) => sum + item.confirmedPackets, 0));
        setTotalIncentive(rows.reduce((sum, item) => sum + item.totalIncentiveRupees, 0));
        setCurrentRate(incRes.currentRatePaise === null ? null : incRes.currentRatePaise / 100);
      }

      if (setRes) {
        setSettings(setRes.settings);
        if (setRes.settings.incentiveRatePaise !== null) {
          setNewRate(String(setRes.settings.incentiveRatePaise / 100));
          setCurrentRate(setRes.settings.incentiveRatePaise / 100);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRate(true);
    try {
      const rateNum = Number(newRate);
      await adminApi.updateIncentiveSettings({
        incentiveRatePaise: rateNum * 100,
      });
      setCurrentRate(rateNum);
      setModalOpen(false);
      setNotice(`Incentive rate updated to ₹${rateNum} per packet.`);
      loadData();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Unable to update incentive rate.");
    } finally {
      setSavingRate(false);
      setTimeout(() => setNotice(""), 3000);
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
        eyebrow="Incentive management"
        title="Seller incentives"
        description="Review confirmed packet sales and calculated performance incentives across the seller network. Rates remain configurable by business policy."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh incentives"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-rose-200 hover:text-[#E61C5D]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550]"
            >
              Configure rule
            </button>
          </div>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Incentive Pool"
          value={`₹${totalIncentive.toLocaleString("en-IN")}`}
          note="Accrued from confirmed sales"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Eligible Confirmed Packets"
          value={totalConfirmed.toLocaleString("en-IN")}
          note="Packets that earned incentive"
          icon="packages"
          tone="rose"
        />
        <MetricCard
          label="Current Rate"
          value={currentRate === null ? "—" : `₹${currentRate}`}
          note="Per confirmed packet"
          icon="rupee"
          tone="amber"
        />
      </div>

      <SectionCard
        title="Seller incentive breakdown"
        description="Confirmed packets contributing to monthly payout"
        className="mt-8"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left">
            <thead className="bg-[#FFF8FA] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
              <tr>
                <th className="px-4 py-4">Seller</th>
                <th className="px-4 py-4">Territory</th>
                <th className="px-4 py-4">Confirmed Packets</th>
                <th className="px-4 py-4">Rate</th>
                <th className="px-4 py-4">Total Incentive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {incentives.map((item) => (
                <tr key={item.sellerId} className="hover:bg-[#FFFDFD]">
                  <td className="px-4 py-4 text-sm font-bold text-zinc-800">{item.sellerName}</td>
                  <td className="px-4 py-4 text-sm text-zinc-500">{item.territory}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{item.confirmedPackets} pkts</td>
                  <td className="px-4 py-4 text-sm text-zinc-500">₹{item.ratePerPacketRupees}</td>
                  <td className="px-4 py-4 text-sm font-bold text-[#156035]">
                    ₹{item.totalIncentiveRupees.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Configure Rate Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 px-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-playfair text-2xl font-bold text-[#156035]">Incentive rule configuration</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Set the per-packet incentive awarded to field Sellers upon confirmed customer delivery.
            </p>

            <form onSubmit={handleSaveRate} className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-zinc-700">
                Incentive Rate (₹ per confirmed packet)
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-bold outline-none focus:border-rose-300"
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 rounded-xl border border-zinc-200 py-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRate}
                  className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] py-3 text-xs font-bold text-white hover:bg-[#c91550] disabled:opacity-70"
                >
                  {savingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-60 rounded-xl bg-[#156035] px-4 py-3 text-sm font-bold text-white shadow-xl">
          {notice}
        </div>
      )}
    </DashboardShell>
  );
}
