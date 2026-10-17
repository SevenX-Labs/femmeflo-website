"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  Coins,
  History,
  Info,
  Layers,
  Loader2,
  Lock,
  Package,
  PackageCheck,
  RefreshCw,
  Store,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import type { ManagerIncentiveData } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export default function ManagerIncentivesPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = ["Manager", user?.district, user?.state].filter(Boolean).join(" · ") || "Territory Leadership";

  const [data, setData] = useState<ManagerIncentiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState<"team" | "personal">("team");
  const [personalSubTab, setPersonalSubTab] = useState<"months" | "sales" | "adjustments" | "payouts">("months");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await managerApi.getIncentives();
      setData(res);
    } catch (err) {
      console.error("Failed to load manager incentives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const team = data?.team;
  const personal = data?.personal;

  const teamSummary = team?.summary ?? {
    assignedSellersCount: 0,
    totalPacketsSold: 0,
    totalIncentiveEarnedRupees: 0,
    totalAdjustedEntitlementRupees: 0,
    totalPaidRupees: 0,
    totalPendingRupees: 0,
    currentMonth: { year: 2026, month: 10, earnedRupees: 0, paidRupees: 0, pendingRupees: 0 },
    previousMonth: { year: 2026, month: 9, earnedRupees: 0, paidRupees: 0, pendingRupees: 0 },
    olderPendingRupees: 0,
  };

  const personalSummary = personal?.summary ?? {
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

  return (
    <DashboardShell
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={getManagerNavigation(user)}
    >
      <PageHeading
        eyebrow="Earnings & Team Performance"
        title="Incentives & Performance Earnings"
        description="Monitor authorized team delivery performance and track your personal field earnings independently without mixing accounts."
        action={
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh incentive stats"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xs transition hover:border-rose-200 hover:text-[#E61C5D]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
          </button>
        }
      />

      {/* Admin Control Advisory Notice */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
        <Lock className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <div>
          <span className="font-bold block">HQ Financial Control Notice</span>
          <span>
            Managers have monitoring access only. Payout disbursements, rate modifications, and balance settlements are strictly administered by Head Office (Super Admin). Team earnings remain independent from personal earnings.
          </span>
        </div>
      </div>

      {/* Main Mode Switcher: My Team vs My Personal Earnings */}
      <div className="mt-8 flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-[#FAF8F5] p-1.5 text-xs font-bold text-zinc-600">
          <button
            onClick={() => setActiveMainTab("team")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
              activeMainTab === "team"
                ? "bg-white text-zinc-950 shadow-xs"
                : "hover:text-zinc-900"
            }`}
          >
            <Users className="h-4 w-4 text-[#E61C5D]" />
            <span>My Team's Earnings</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700">
              {teamSummary.assignedSellersCount} Members
            </span>
          </button>
          <button
            onClick={() => setActiveMainTab("personal")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
              activeMainTab === "personal"
                ? "bg-white text-zinc-950 shadow-xs"
                : "hover:text-zinc-900"
            }`}
          >
            <User className="h-4 w-4 text-emerald-700" />
            <span>My Personal Earnings</span>
            {personalSummary.totalPacketsSold > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
                {personalSummary.totalPacketsSold} pkts
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB A: MY TEAM'S EARNINGS */}
      {activeMainTab === "team" && (
        <div className="mt-6 space-y-6">
          {/* Team KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Assigned Team Members"
              value={teamSummary.assignedSellersCount.toString()}
              note="Active Field Officers in territory"
              icon="package"
            />
            <MetricCard
              label="Total Team Packets Sold"
              value={teamSummary.totalPacketsSold.toLocaleString("en-IN")}
              note="Delivered & confirmed volume"
              icon="packages"
              tone="amber"
            />
            <MetricCard
              label="Team Entitlement Accrued"
              value={`₹${teamSummary.totalAdjustedEntitlementRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              note="Total earned across team"
              icon="rupee"
              tone="green"
            />
            <MetricCard
              label="Team Pending Balance"
              value={`₹${teamSummary.totalPendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              note={`₹${teamSummary.totalPaidRupees.toLocaleString("en-IN")} already settled`}
              icon="rupee"
              tone={teamSummary.totalPendingRupees > 0 ? "rose" : "green"}
            />
          </div>

          {/* Monthly Aging Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Current Month Team Pending ({teamSummary.currentMonth.month}/{teamSummary.currentMonth.year})
                </span>
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-zinc-900">
                ₹{teamSummary.currentMonth.pendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>Earned: ₹{teamSummary.currentMonth.earnedRupees.toLocaleString("en-IN")}</span>
                <span>Paid: ₹{teamSummary.currentMonth.paidRupees.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Previous Month Team Pending ({teamSummary.previousMonth.month}/{teamSummary.previousMonth.year})
                </span>
                <History className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-amber-600">
                ₹{teamSummary.previousMonth.pendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>Earned: ₹{teamSummary.previousMonth.earnedRupees.toLocaleString("en-IN")}</span>
                <span>Paid: ₹{teamSummary.previousMonth.paidRupees.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Older Team Pending
                </span>
                <AlertCircle className="h-4 w-4 text-rose-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-rose-600">
                ₹{teamSummary.olderPendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Awaiting HQ settlement from previous periods
              </p>
            </div>
          </div>

          {/* Team Members Breakdown Table */}
          <SectionCard
            title="Assigned Field Officers Incentive Breakdown"
            description="Individual earnings, volume delivered, and payment status for field officers under your supervision."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead className="border-b border-zinc-100 bg-[#FFF8FA] text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="px-4 py-3.5">Field Officer</th>
                    <th className="px-4 py-3.5">Territory</th>
                    <th className="px-4 py-3.5 text-right">Confirmed Packets</th>
                    <th className="px-4 py-3.5 text-right">Total Earned</th>
                    <th className="px-4 py-3.5 text-right">Adjustments</th>
                    <th className="px-4 py-3.5 text-right">Entitlement</th>
                    <th className="px-4 py-3.5 text-right">Paid</th>
                    <th className="px-4 py-3.5 text-right">Pending</th>
                    <th className="px-4 py-3.5 text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(team?.members || []).map((m) => (
                    <tr key={m.sellerId} className="transition hover:bg-zinc-50/70">
                      <td className="px-4 py-4">
                        <div className="font-bold text-zinc-900">{m.sellerName}</div>
                        <div className="text-[10px] text-zinc-500">{m.phone || "No phone"}</div>
                      </td>
                      <td className="px-4 py-4 text-zinc-600">{m.territory}</td>
                      <td className="px-4 py-4 text-right font-semibold text-zinc-800">
                        {m.confirmedPackets.toLocaleString("en-IN")} pkts
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-zinc-700">
                        ₹{m.earnedRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {m.additionsPaise - m.deductionsPaise > 0 ? (
                          <span className="text-emerald-700">
                            +₹{((m.additionsPaise - m.deductionsPaise) / 100).toFixed(2)}
                          </span>
                        ) : m.additionsPaise - m.deductionsPaise < 0 ? (
                          <span className="text-rose-700">
                            -₹{((m.deductionsPaise - m.additionsPaise) / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-zinc-400">0.00</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-zinc-900">
                        ₹{m.adjustedEntitlementRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-zinc-700">
                        ₹{m.totalPaidRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-black">
                        <span className={m.outstandingRupees > 0 ? "text-rose-600" : "text-emerald-700"}>
                          ₹{m.outstandingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
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
                  {!loading && (team?.members || []).length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-zinc-500">
                        No team members currently assigned under your supervision.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB B: MY PERSONAL EARNINGS (WHEN MANAGER SELLS AS SELLER) */}
      {activeMainTab === "personal" && (
        <div className="mt-6 space-y-6">
          {/* Personal Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="My Adjusted Entitlement"
              value={`₹${(personalSummary.adjustedEntitlementRupees ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              note="Personal sales rewards + adjustments"
              icon="rupee"
              tone="green"
            />
            <MetricCard
              label="My Amount Received (Paid)"
              value={`₹${(personalSummary.totalPaidRupees ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              note="Personal disbursements received"
              icon="rupee"
            />
            <MetricCard
              label="My Outstanding Pending"
              value={`₹${(personalSummary.outstandingRupees ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              note={personalSummary.outstandingRupees === 0 ? "Personal earnings settled" : "Awaiting HQ disbursement"}
              icon="rupee"
              tone={(personalSummary.outstandingRupees ?? 0) > 0 ? "rose" : "green"}
            />
            <MetricCard
              label="My Delivered Packets"
              value={personalSummary.totalPacketsSold.toLocaleString("en-IN")}
              note="Personal confirmed customer sales"
              icon="packages"
              tone="amber"
            />
          </div>

          {/* Sub-tabs for personal ledger */}
          <SectionCard
            title="My Personal Sales & Payout Ledger"
            description="Complete audit of personal sales events, monthly accounting periods, and payments disbursed to you."
            action={
              <div className="flex items-center rounded-xl border border-zinc-200 bg-[#FAF8F5] p-1 text-xs font-bold text-zinc-600">
                <button
                  onClick={() => setPersonalSubTab("months")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    personalSubTab === "months" ? "bg-white text-zinc-900 shadow-xs" : "hover:text-zinc-900"
                  }`}
                >
                  Monthly Periods ({(personal?.months || []).length})
                </button>
                <button
                  onClick={() => setPersonalSubTab("sales")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    personalSubTab === "sales" ? "bg-white text-zinc-900 shadow-xs" : "hover:text-zinc-900"
                  }`}
                >
                  Personal Sales ({(personal?.items || []).length})
                </button>
                <button
                  onClick={() => setPersonalSubTab("payouts")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    personalSubTab === "payouts" ? "bg-white text-zinc-900 shadow-xs" : "hover:text-zinc-900"
                  }`}
                >
                  Payouts Received ({(personal?.payouts || []).length})
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              {personalSubTab === "months" && (
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="pb-3.5">Period</th>
                      <th className="pb-3.5 text-right">Packets Sold</th>
                      <th className="pb-3.5 text-right">Earned</th>
                      <th className="pb-3.5 text-right">Adjustments</th>
                      <th className="pb-3.5 text-right">Total Entitlement</th>
                      <th className="pb-3.5 text-right">Amount Paid</th>
                      <th className="pb-3.5 text-right">Pending Balance</th>
                      <th className="pb-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(personal?.months || []).map((m) => (
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
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loading && (personal?.months || []).length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-sm text-zinc-500">
                          No personal monthly accounting periods found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {personalSubTab === "sales" && (
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="pb-3.5">Customer Shop</th>
                      <th className="pb-3.5">Delivered Packets</th>
                      <th className="pb-3.5">Rate Applied</th>
                      <th className="pb-3.5">Confirmed Date</th>
                      <th className="pb-3.5 text-right">Incentive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(personal?.items || []).map((row) => (
                      <tr key={row.saleId} className="transition hover:bg-zinc-50/60">
                        <td className="py-4">
                          <div className="font-bold text-zinc-900">{row.customer?.shopName || "Customer Shop"}</div>
                          <div className="text-[10px] text-zinc-500">{row.customer?.contactName}</div>
                        </td>
                        <td className="py-4 font-semibold text-zinc-900">{row.quantity} pkts</td>
                        <td className="py-4 font-mono text-zinc-600">
                          {row.incentiveRatePaise ? `₹${(row.incentiveRatePaise / 100).toFixed(2)}/pkt` : "—"}
                        </td>
                        <td className="py-4 text-zinc-500">
                          {new Date(row.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 text-right">
                          <span className="font-bold text-[#156035]">
                            ₹{(row.incentiveAmountPaise / 100).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loading && (personal?.items || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                          No personal confirmed sales recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {personalSubTab === "payouts" && (
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="pb-3.5">Payment Date</th>
                      <th className="pb-3.5">Method & Reference</th>
                      <th className="pb-3.5">Remarks</th>
                      <th className="pb-3.5 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(personal?.payouts || []).map((p) => (
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
                            <div className="text-[10px] font-mono text-zinc-500">Ref: {p.referenceId}</div>
                          )}
                        </td>
                        <td className="py-4 text-zinc-700">{p.remarks || "—"}</td>
                        <td className="py-4 text-right">
                          <span className="font-black text-emerald-800 text-sm">
                            ₹{(p.amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loading && (personal?.payouts || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-sm text-zinc-500">
                          No personal disbursements received yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </DashboardShell>
  );
}
