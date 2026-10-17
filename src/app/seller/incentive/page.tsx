"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  Package,
  Receipt,
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
  const userDetail = ["Field Officer", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const [data, setData] = useState<SellerIncentiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"months" | "sales" | "adjustments" | "payouts">("months");

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

  const summary = data?.summary ?? {
    totalPacketsSold: 0,
    totalIncentivePaise: 0,
    totalIncentiveRupees: 0,
    additionsRupees: 0,
    deductionsRupees: 0,
    adjustedEntitlementRupees: 0,
    totalPaidRupees: 0,
    outstandingRupees: 0,
    status: "UNPAID" as const,
    olderPendingRupees: 0,
  };

  const currentMonth = summary.currentMonth;
  const previousMonth = summary.previousMonth;
  const months = data?.months ?? [];
  const items = data?.items ?? [];
  const adjustments = data?.adjustments ?? [];
  const payouts = data?.payouts ?? [];

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Rewards & Settlements"
        title="My Incentive & Payment History"
        description="Comprehensive accounting of your confirmed packet sales rewards, HQ policy adjustments, and official disbursements received."
        action={
          <button
            onClick={loadIncentives}
            disabled={loading}
            title="Refresh incentive stats"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xs transition hover:border-rose-200 hover:text-[#E61C5D]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
          </button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Adjusted Entitlement"
          value={`₹${(summary.adjustedEntitlementRupees ?? summary.totalIncentiveRupees).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          note="Eligible sales + approved adjustments"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Total Disbursed (Paid)"
          value={`₹${(summary.totalPaidRupees ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          note="Payments received to date"
          icon="rupee"
        />
        <MetricCard
          label="Pending / Receivable Balance"
          value={`₹${(summary.outstandingRupees ?? summary.totalIncentiveRupees).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          note={summary.outstandingRupees === 0 ? "All earnings fully settled" : "Awaiting HQ disbursement"}
          icon="rupee"
          tone={(summary.outstandingRupees ?? 0) > 0 ? "rose" : "green"}
        />
        <MetricCard
          label="Delivered Packet Volume"
          value={summary.totalPacketsSold.toLocaleString("en-IN")}
          note="Confirmed field deliveries"
          icon="packages"
          tone="amber"
        />
      </div>

      {/* Monthly Aging Cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Current Month Pending {currentMonth ? `(${currentMonth.month}/${currentMonth.year})` : ""}
            </span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-zinc-900">
            ₹{(currentMonth ? currentMonth.outstandingPaise / 100 : 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Earned: ₹{(currentMonth ? currentMonth.salesIncentivePaise / 100 : 0).toFixed(2)}</span>
            <span>Paid: ₹{(currentMonth ? currentMonth.allocatedPaidPaise / 100 : 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Previous Month Pending {previousMonth ? `(${previousMonth.month}/${previousMonth.year})` : ""}
            </span>
            <History className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">
            ₹{(previousMonth ? previousMonth.outstandingPaise / 100 : 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Earned: ₹{(previousMonth ? previousMonth.salesIncentivePaise / 100 : 0).toFixed(2)}</span>
            <span>Paid: ₹{(previousMonth ? previousMonth.allocatedPaidPaise / 100 : 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Older Unpaid Balances
            </span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">
            ₹{(summary.olderPendingRupees ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Carried forward from earlier periods
          </p>
        </div>
      </div>

      {/* Tabs and Ledgers */}
      <SectionCard
        title="Incentive & Payment Ledger"
        description="Detailed record of monthly accounting periods, confirmed sales events, manual adjustments, and payment disbursements."
        className="mt-8"
        action={
          <div className="flex items-center rounded-xl border border-zinc-200 bg-[#FAF8F5] p-1 text-xs font-bold text-zinc-600">
            <button
              onClick={() => setActiveTab("months")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "months" ? "bg-white text-zinc-900 shadow-xs" : "hover:text-zinc-900"
              }`}
            >
              Monthly Periods ({months.length})
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "sales" ? "bg-white text-zinc-900 shadow-xs" : "hover:text-zinc-900"
              }`}
            >
              Confirmed Deliveries ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("adjustments")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "adjustments" ? "bg-white text-zinc-900 shadow-xs" : "hover:text-zinc-900"
              }`}
            >
              Adjustments ({adjustments.length})
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "payouts" ? "bg-white text-zinc-900 shadow-xs" : "hover:text-zinc-900"
              }`}
            >
              Payments Received ({payouts.length})
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          {/* TAB 1: Monthly Accounting */}
          {activeTab === "months" && (
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="pb-3.5">Payment Period</th>
                  <th className="pb-3.5 text-right">Packets Sold</th>
                  <th className="pb-3.5 text-right">Earned</th>
                  <th className="pb-3.5 text-right">Adjustments</th>
                  <th className="pb-3.5 text-right">Total Entitlement</th>
                  <th className="pb-3.5 text-right">Amount Paid</th>
                  <th className="pb-3.5 text-right">Pending Balance</th>
                  <th className="pb-3.5 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {months.map((m) => (
                  <tr key={`${m.year}-${m.month}`} className="transition hover:bg-zinc-50/60">
                    <td className="py-4 font-bold text-zinc-900">{m.label}</td>
                    <td className="py-4 text-right font-semibold text-zinc-800">
                      {m.confirmedPackets.toLocaleString("en-IN")} pkts
                    </td>
                    <td className="py-4 text-right font-medium text-zinc-700">
                      ₹{(m.salesIncentivePaise / 100).toFixed(2)}
                    </td>
                    <td className="py-4 text-right font-semibold">
                      {m.additionsPaise - m.deductionsPaise > 0 ? (
                        <span className="text-emerald-700">+₹{((m.additionsPaise - m.deductionsPaise) / 100).toFixed(2)}</span>
                      ) : m.additionsPaise - m.deductionsPaise < 0 ? (
                        <span className="text-rose-700">-₹{((m.deductionsPaise - m.additionsPaise) / 100).toFixed(2)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 text-right font-bold text-zinc-900">
                      ₹{(m.adjustedEntitlementPaise / 100).toFixed(2)}
                    </td>
                    <td className="py-4 text-right font-semibold text-emerald-800">
                      ₹{(m.allocatedPaidPaise / 100).toFixed(2)}
                    </td>
                    <td className="py-4 text-right font-black">
                      <span className={m.outstandingPaise > 0 ? "text-rose-600" : "text-emerald-700"}>
                        ₹{(m.outstandingPaise / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          m.status === "PAID"
                            ? "bg-emerald-50 text-emerald-800"
                            : m.status === "PARTIALLY_PAID"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {m.status === "PAID" ? "Paid" : m.status === "PARTIALLY_PAID" ? "Partially Paid" : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && months.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-zinc-500">
                      No monthly accounting periods recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: Confirmed Deliveries */}
          {activeTab === "sales" && (
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="pb-3.5">Customer Shop</th>
                  <th className="pb-3.5">Delivered Packets</th>
                  <th className="pb-3.5">Applied Rate</th>
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
                    <td className="py-4 font-mono text-zinc-600">
                      {row.incentiveRatePaise === null ? "—" : `₹${(row.incentiveRatePaise / 100).toFixed(2)}/pkt`}
                    </td>
                    <td className="py-4 text-zinc-500">
                      {new Date(row.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-bold text-[#156035]">
                        ₹{(row.incentiveAmountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                      No confirmed deliveries found. Once sales are verified, rewards appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: Adjustments */}
          {activeTab === "adjustments" && (
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="pb-3.5">Adjustment Date</th>
                  <th className="pb-3.5">Action Type</th>
                  <th className="pb-3.5">Amount</th>
                  <th className="pb-3.5">Approved Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="transition hover:bg-zinc-50/60">
                    <td className="py-4 font-medium text-zinc-700">
                      {new Date(adj.adjustmentDate || adj.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                          adj.type === "ADD" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {adj.type === "ADD" ? "Addition (+)" : "Deduction (-)"}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-zinc-900">
                      {adj.type === "ADD" ? "+" : "-"}₹{(adj.amountPaise / 100).toFixed(2)}
                    </td>
                    <td className="py-4 text-zinc-700">{adj.reason}</td>
                  </tr>
                ))}
                {!loading && adjustments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-zinc-500">
                      No manual adjustments recorded on your account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 4: Payments Received */}
          {activeTab === "payouts" && (
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="pb-3.5">Disbursement Date</th>
                  <th className="pb-3.5">Method & Reference</th>
                  <th className="pb-3.5">Remarks</th>
                  <th className="pb-3.5">Settlement Allocation</th>
                  <th className="pb-3.5 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="transition hover:bg-zinc-50/60">
                    <td className="py-4 font-medium text-zinc-700">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-zinc-900">{p.paymentMethod}</div>
                      {p.referenceId && (
                        <div className="text-[10px] font-mono text-zinc-500">
                          Ref: {p.referenceId}
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-zinc-700">{p.remarks || "—"}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {(p.allocations || []).map((alloc, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700"
                          >
                            {alloc.periodMonth}/{alloc.periodYear}: ₹{(alloc.amountPaise / 100).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-black text-emerald-800 text-sm">
                        ₹{(p.amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && payouts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                      No payment disbursements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {loading && (
            <div className="py-12 text-center text-sm text-zinc-500">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#E61C5D]" />
                <span>Loading incentive data...</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
