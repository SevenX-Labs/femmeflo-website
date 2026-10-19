"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  Edit3,
  Eye,
  Filter,
  History,
  IndianRupee,
  Layers,
  Loader2,
  Package,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Search,
  Sliders,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type {
  AdminIncentiveCompanySummary,
  AdminIncentivesResponse,
  AdminUserIncentiveDetailsResponse,
  BusinessSettings,
  IncentiveSummaryItem,
} from "@/lib/api/types";

export default function AdminIncentivesPage() {
  const [data, setData] = useState<AdminIncentivesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "SELLER" | "MANAGER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNPAID" | "PARTIALLY_PAID" | "PAID">("ALL");

  // Notification Banner
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Configure Global Rule Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [newGlobalRate, setNewGlobalRate] = useState("15");
  const [savingGlobalRule, setSavingGlobalRule] = useState(false);

  // Edit Individual Rate Modal
  const [rateModalUser, setRateModalUser] = useState<IncentiveSummaryItem | null>(null);
  const [customRateInput, setCustomRateInput] = useState("");
  const [customRateDate, setCustomRateDate] = useState("");
  const [customRateReason, setCustomRateReason] = useState("");
  const [savingUserRate, setSavingUserRate] = useState(false);

  // Adjust Incentive Modal (Add / Deduct)
  const [adjModalUser, setAdjModalUser] = useState<IncentiveSummaryItem | null>(null);
  const [adjType, setAdjType] = useState<"ADD" | "DEDUCT">("ADD");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjDate, setAdjDate] = useState("");
  const [savingAdj, setSavingAdj] = useState(false);

  // Mark Paid / Record Payout Modal
  const [payModalUser, setPayModalUser] = useState<IncentiveSummaryItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("BANK");
  const [payDate, setPayDate] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [savingPay, setSavingPay] = useState(false);

  // View Details Drawer / Modal
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [detailsData, setDetailsData] = useState<AdminUserIncentiveDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"months" | "sales" | "adjustments" | "payouts">("months");

  const notify = (text: string, type: "success" | "error" = "success") => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, setRes] = await Promise.all([
        adminApi.getIncentives({
          role: roleFilter !== "ALL" ? roleFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          search: search.trim() || undefined,
        }).catch((err) => {
          console.error("Failed to load incentives:", err);
          return null;
        }),
        adminApi.getIncentiveSettings().catch(() => null),
      ]);

      if (res) {
        setData(res);
      }
      if (setRes) {
        setSettings(setRes.settings);
        if (setRes.settings.incentiveRatePaise) {
          setNewGlobalRate((setRes.settings.incentiveRatePaise / 100).toString());
        }
      }
    } catch (err: unknown) {
      console.error(err);
      notify("Failed to retrieve incentive data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, statusFilter]);

  // Handle Global Rule Save
  const handleSaveGlobalRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(newGlobalRate);
    if (isNaN(rateNum) || rateNum < 0) {
      notify("Please enter a valid rate amount", "error");
      return;
    }
    setSavingGlobalRule(true);
    try {
      const ratePaise = Math.round(rateNum * 100);
      await adminApi.updateIncentiveSettings({ incentiveRatePaise: ratePaise });
      notify(`Default incentive rule updated to ₹${rateNum.toFixed(2)} per packet.`);
      setRuleModalOpen(false);
      loadData();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Unable to update default incentive rule.", "error");
    } finally {
      setSavingGlobalRule(false);
    }
  };

  // Open Edit User Rate Modal
  const openEditRateModal = (user: IncentiveSummaryItem) => {
    setRateModalUser(user);
    setCustomRateInput(user.ratePerPacketRupees.toString());
    setCustomRateDate(new Date().toISOString().split("T")[0]);
    setCustomRateReason("");
  };

  // Save Individual User Rate
  const handleSaveUserRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateModalUser) return;
    const rateNum = parseFloat(customRateInput);
    if (isNaN(rateNum) || rateNum < 0) {
      notify("Please enter a valid rate per packet", "error");
      return;
    }
    setSavingUserRate(true);
    try {
      const ratePaise = Math.round(rateNum * 100);
      await adminApi.updateUserRate(rateModalUser.sellerId, {
        ratePaise,
        effectiveDate: customRateDate || undefined,
        reason: customRateReason || undefined,
      });
      notify(`Incentive rate for ${rateModalUser.sellerName} updated to ₹${rateNum.toFixed(2)}/packet.`);
      setRateModalUser(null);
      loadData();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Failed to update employee rate.", "error");
    } finally {
      setSavingUserRate(false);
    }
  };

  // Open Adjustment Modal
  const openAdjModal = (user: IncentiveSummaryItem) => {
    setAdjModalUser(user);
    setAdjType("ADD");
    setAdjAmount("");
    setAdjReason("");
    setAdjDate(new Date().toISOString().split("T")[0]);
  };

  // Save Adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjModalUser) return;
    const amountNum = parseFloat(adjAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      notify("Please enter a positive adjustment amount", "error");
      return;
    }
    if (!adjReason.trim()) {
      notify("Please provide a reason for the adjustment", "error");
      return;
    }
    setSavingAdj(true);
    try {
      const amountPaise = Math.round(amountNum * 100);
      await adminApi.createAdjustment(adjModalUser.sellerId, {
        type: adjType,
        amountPaise,
        reason: adjReason.trim(),
        adjustmentDate: adjDate || undefined,
      });
      notify(`Incentive adjustment (${adjType === "ADD" ? "+₹" : "-₹"}${amountNum.toFixed(2)}) recorded for ${adjModalUser.sellerName}.`);
      setAdjModalUser(null);
      loadData();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Failed to record incentive adjustment.", "error");
    } finally {
      setSavingAdj(false);
    }
  };

  // Open Payment Modal
  const openPayModal = (user: IncentiveSummaryItem) => {
    setPayModalUser(user);
    const pendingRupees = (user.outstandingPaise / 100).toFixed(2);
    setPayAmount(pendingRupees);
    setPayMethod("BANK");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayRef("");
    setPayRemarks("");
  };

  // Save Payment
  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalUser) return;
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      notify("Please enter a valid payout amount greater than zero", "error");
      return;
    }
    const maxRupees = payModalUser.outstandingPaise / 100;
    if (amountNum > maxRupees) {
      notify(`Payment cannot exceed the outstanding balance of ₹${maxRupees.toFixed(2)}`, "error");
      return;
    }
    setSavingPay(true);
    try {
      const amountPaise = Math.round(amountNum * 100);
      const reqKey = `pay_${payModalUser.sellerId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await adminApi.createPayout(payModalUser.sellerId, {
        amountPaise,
        paymentMethod: payMethod,
        referenceId: payRef || undefined,
        remarks: payRemarks || undefined,
        paymentDate: payDate || undefined,
        requestKey: reqKey,
      });
      notify(`Payment of ₹${amountNum.toFixed(2)} recorded successfully for ${payModalUser.sellerName}.`);
      setPayModalUser(null);
      loadData();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Failed to record payment.", "error");
    } finally {
      setSavingPay(false);
    }
  };

  // Open Details Drawer / Modal
  const openDetails = async (userId: string) => {
    setDetailsUserId(userId);
    setDetailsTab("months");
    setLoadingDetails(true);
    try {
      const res = await adminApi.getUserIncentiveDetails(userId);
      setDetailsData(res);
    } catch (err: unknown) {
      notify("Failed to fetch employee incentive details", "error");
      setDetailsUserId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filtered List
  const usersList = useMemo(() => {
    if (!data) return [];
    const list = data.users ?? data.sellers ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter(
      (u) =>
        u.sellerName.toLowerCase().includes(q) ||
        (u as any).seller?.phone?.includes(q) ||
        (u as any).seller?.employeeCode?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const summary = data?.summary ?? {
    totalEarnedRupees: 0,
    totalAdjustedEntitlementRupees: 0,
    totalPaidRupees: 0,
    totalPendingRupees: 0,
    currentMonth: { year: 2026, month: 10, earnedRupees: 0, paidRupees: 0, pendingRupees: 0 },
    previousMonth: { year: 2026, month: 9, earnedRupees: 0, paidRupees: 0, pendingRupees: 0 },
    olderPendingRupees: 0,
    pendingEmployeesCount: 0,
  };

  const currentDefaultRateRupees = data?.currentRatePaise ? (data.currentRatePaise / 100).toFixed(2) : "—";

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office · Finance & Incentives"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Financial Operations"
        title="Incentive, Salary & Payout Management"
        description="Comprehensive management of confirmed sales incentives, individual custom rates, manual adjustments, partial payments, and month-by-month settlement accounting."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh incentives"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xs transition hover:border-rose-200 hover:text-[#E61C5D]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              onClick={() => setRuleModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550]"
            >
              <Sliders className="h-4 w-4" />
              <span>Default policy rule</span>
            </button>
          </div>
        }
      />

      {/* Top Financial Liability & Settlement Summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Adjusted Liability"
          value={`₹${summary.totalAdjustedEntitlementRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          note="Eligible sales + approved adjustments"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Total Disbursed (Paid)"
          value={`₹${summary.totalPaidRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          note="Actual payment disbursements"
          icon="rupee"
        />
        <MetricCard
          label="Outstanding Payable Balance"
          value={`₹${summary.totalPendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          note={`${summary.pendingEmployeesCount} personnel with pending balance`}
          icon="rupee"
          tone={summary.totalPendingRupees > 0 ? "rose" : "green"}
        />
        <MetricCard
          label="Default System Rate"
          value={currentDefaultRateRupees === "—" ? "—" : `₹${currentDefaultRateRupees}/pkt`}
          note="Applied when individual rate is not customized"
          icon="packages"
          tone="amber"
        />
      </div>

      {/* Monthly Aging Breakdown Overview */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_4px_20px_rgba(21,96,53,0.04)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Current Month Pending ({summary.currentMonth.month}/{summary.currentMonth.year})
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-sans tracking-tight text-zinc-900">
            ₹{summary.currentMonth.pendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs font-medium text-zinc-500">
            <span>Accrued: <strong className="text-zinc-700">₹{summary.currentMonth.earnedRupees.toLocaleString("en-IN")}</strong></span>
            <span>Paid: <strong className="text-emerald-700">₹{summary.currentMonth.paidRupees.toLocaleString("en-IN")}</strong></span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-[0_4px_20px_rgba(217,119,6,0.04)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Previous Month Pending ({summary.previousMonth.month}/{summary.previousMonth.year})
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <History className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-sans tracking-tight text-amber-600">
            ₹{summary.previousMonth.pendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs font-medium text-zinc-500">
            <span>Accrued: <strong className="text-zinc-700">₹{summary.previousMonth.earnedRupees.toLocaleString("en-IN")}</strong></span>
            <span>Paid: <strong className="text-emerald-700">₹{summary.previousMonth.paidRupees.toLocaleString("en-IN")}</strong></span>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_4px_20px_rgba(230,28,93,0.04)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Older Unpaid Balances
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-[#E61C5D]">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-sans tracking-tight text-[#E61C5D]">
            ₹{summary.olderPendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-3 border-t border-zinc-100 pt-2 text-xs font-medium text-zinc-500">
            Outstanding from earlier payment periods
          </p>
        </div>
      </div>

      {/* Main Employee Incentive Register */}
      <section className="mt-8 rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(104,48,66,0.04)]">
        {/* Header with Title and Search/Filters cleanly separated */}
        <div className="flex flex-col gap-4 border-b border-rose-100/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#156035]">
              Personnel Incentive & Settlement Register
            </h2>
            <p className="mt-1 text-xs text-zinc-600 font-medium">
              Every Seller and Manager's eligible sales volume, per-packet rate, adjustments, cumulative entitlement, disbursed payments, and outstanding liability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, code..."
                className="h-10 w-full sm:w-64 rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-9 pr-3 text-xs font-medium text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-[#FAF8F5] p-1 text-xs font-bold text-zinc-600">
              {(["ALL", "SELLER", "MANAGER"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    roleFilter === r
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {r === "ALL" ? "All Roles" : r === "SELLER" ? "Field Officers" : "Managers"}
                </button>
              ))}
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-[#FAF8F5] p-1 text-xs font-bold text-zinc-600">
              {(["ALL", "UNPAID", "PARTIALLY_PAID", "PAID"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    statusFilter === s
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {s === "ALL" ? "All Status" : s === "UNPAID" ? "Unpaid" : s === "PARTIALLY_PAID" ? "Partial" : "Settled"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[#FFF5F7] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700 border-b border-rose-100/70">
              <tr>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Role & Team</th>
                <th className="px-4 py-3.5">Rate / Pkt</th>
                <th className="px-4 py-3.5 text-right">Confirmed Pkts</th>
                <th className="px-4 py-3.5 text-right">Earned</th>
                <th className="px-4 py-3.5 text-right">Adjustments</th>
                <th className="px-4 py-3.5 text-right">Entitlement</th>
                <th className="px-4 py-3.5 text-right">Paid</th>
                <th className="px-4 py-3.5 text-right">Pending</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {usersList.map((row) => {
                const pendingRupees = row.outstandingPaise / 100;
                const paidRupees = row.totalPaidPaise / 100;
                const earnedRupees = row.earnedPaise / 100;
                const entitlementRupees = row.adjustedEntitlementPaise / 100;
                const netAdjRupees = (row.additionsPaise - row.deductionsPaise) / 100;

                return (
                  <tr key={row.sellerId} className="transition hover:bg-zinc-50/70">
                    <td className="px-4 py-4">
                      <div className="font-bold text-zinc-900">{row.sellerName}</div>
                      <div className="text-[11px] text-zinc-500">
                        {row.territory} · {(row as any).seller?.phone || "No phone"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-extrabold text-zinc-800">
                        {row.role === "MANAGER" ? "Manager" : "Field Officer"}
                      </div>
                      {row.manager && (
                        <div className="mt-0.5 text-[10px] text-zinc-500">
                          Team: {row.manager.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-900">
                          ₹{row.ratePerPacketRupees.toFixed(2)}
                        </span>
                        {row.isCustomRate ? (
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-[#E61C5D]">
                            Custom
                          </span>
                        ) : (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-zinc-800">
                      {row.confirmedPackets.toLocaleString("en-IN")} pkts
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-zinc-700">
                      ₹{earnedRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {netAdjRupees > 0 ? (
                        <span className="text-emerald-700">+{netAdjRupees.toFixed(2)}</span>
                      ) : netAdjRupees < 0 ? (
                        <span className="text-rose-700">{netAdjRupees.toFixed(2)}</span>
                      ) : (
                        <span className="text-zinc-400">0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-zinc-900">
                      ₹{entitlementRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-zinc-700">
                      ₹{paidRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-right font-black">
                      <span className={pendingRupees > 0 ? "text-rose-600" : "text-emerald-700"}>
                        ₹{pendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {row.status === "PAID" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                          Paid
                        </span>
                      ) : row.status === "PARTIALLY_PAID" ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                          Partially Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-800">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetails(row.sellerId)}
                          title="View Ledger & History"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditRateModal(row)}
                          title="Edit Incentive Rate"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:border-amber-300 hover:text-amber-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openAdjModal(row)}
                          title="Adjust Incentive (Plus/Minus)"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openPayModal(row)}
                          disabled={row.outstandingPaise <= 0}
                          title={row.outstandingPaise <= 0 ? "Balance fully settled" : "Record Payment / Mark Paid"}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                            row.outstandingPaise > 0
                              ? "bg-[#156035] text-white hover:bg-[#0f4626] shadow-xs"
                              : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                          }`}
                        >
                          <Banknote className="h-3.5 w-3.5" />
                          <span>Pay</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && usersList.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-zinc-500">
                    No matching employee incentive records found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#E61C5D]" />
                      <span>Loading incentive records...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 1. Global Default Rate Modal */}
      {ruleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs"
          onClick={() => setRuleModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-playfair text-xl font-bold text-[#156035]">Global Default Policy Rule</h3>
              <button
                onClick={() => setRuleModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
              Sets the system-wide fallback per-packet incentive awarded upon confirmed customer delivery. Individual custom rates take precedence over this value.
            </p>

            <form onSubmit={handleSaveGlobalRule} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  Default Rate (₹ per confirmed packet)
                </label>
                <div className="relative mt-1.5 flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-zinc-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    required
                    value={newGlobalRate}
                    onChange={(e) => setNewGlobalRate(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-8 pr-3 text-sm font-bold text-zinc-900 outline-none focus:border-rose-300"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="w-1/2 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGlobalRule}
                  className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] py-2.5 text-xs font-bold text-white hover:bg-[#c91550] disabled:opacity-70"
                >
                  {savingGlobalRule ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Global Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Individual Rate Modal */}
      {rateModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs"
          onClick={() => setRateModalUser(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-playfair text-xl font-bold text-zinc-900">Configure Incentive Rate</h3>
              <button
                onClick={() => setRateModalUser(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 rounded-xl bg-zinc-50 p-3 text-xs border border-zinc-200/70">
              <span className="font-bold text-zinc-900">{rateModalUser.sellerName}</span>
              <span className="text-zinc-500 block mt-0.5">
                Current Applied Rate: ₹{rateModalUser.ratePerPacketRupees.toFixed(2)} / pkt
              </span>
            </div>

            <form onSubmit={handleSaveUserRate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  New Rate (₹ per confirmed packet, e.g. 0.50, 1.25)
                </label>
                <div className="relative mt-1.5 flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-zinc-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    required
                    value={customRateInput}
                    onChange={(e) => setCustomRateInput(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-8 pr-3 text-sm font-bold text-zinc-900 outline-none focus:border-rose-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">Effective Date</label>
                <input
                  type="date"
                  value={customRateDate}
                  onChange={(e) => setCustomRateDate(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-medium text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">Reason for Rate Change</label>
                <input
                  type="text"
                  placeholder="e.g. Territory promotion, seniority increment..."
                  value={customRateReason}
                  onChange={(e) => setCustomRateReason(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-medium text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRateModalUser(null)}
                  className="w-1/2 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUserRate}
                  className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] py-2.5 text-xs font-bold text-white hover:bg-[#c91550] disabled:opacity-70"
                >
                  {savingUserRate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Adjust Incentive Modal (Add / Deduct) */}
      {adjModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs"
          onClick={() => setAdjModalUser(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-playfair text-xl font-bold text-zinc-900">Manual Incentive Adjustment</h3>
              <button
                onClick={() => setAdjModalUser(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 rounded-xl bg-zinc-50 p-3 text-xs border border-zinc-200/70">
              <span className="font-bold text-zinc-900">{adjModalUser.sellerName}</span>
              <div className="mt-1 flex items-center justify-between text-zinc-600">
                <span>Current Entitlement: ₹{(adjModalUser.adjustedEntitlementPaise / 100).toFixed(2)}</span>
                <span>Outstanding: ₹{(adjModalUser.outstandingPaise / 100).toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="mt-4 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType("ADD")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition ${
                      adjType === "ADD"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Add Incentive (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType("DEDUCT")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition ${
                      adjType === "DEDUCT"
                        ? "border-rose-600 bg-rose-50 text-rose-800"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4" />
                    <span>Deduct (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">Amount (₹, e.g. 50.00, 100.00)</label>
                <div className="relative mt-1.5 flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-zinc-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-8 pr-3 text-sm font-bold text-zinc-900 outline-none focus:border-rose-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">Adjustment Date</label>
                <input
                  type="date"
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-medium text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">Reason / Business Note (Required)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Special campaign performance reward, customer dispute correction..."
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3 text-xs font-medium text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjModalUser(null)}
                  className="w-1/2 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdj}
                  className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] py-2.5 text-xs font-bold text-white hover:bg-[#c91550] disabled:opacity-70"
                >
                  {savingAdj ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Mark Paid / Record Payout Modal */}
      {payModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs"
          onClick={() => setPayModalUser(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-playfair text-xl font-bold text-[#156035]">Record Payout (Mark Paid)</h3>
              <button
                onClick={() => setPayModalUser(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-emerald-50/60 p-3.5 text-xs border border-emerald-100">
              <div className="font-bold text-zinc-900 text-sm">{payModalUser.sellerName}</div>
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-emerald-100/80 pt-2 text-zinc-600">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Entitlement</span>
                  <span className="font-bold text-zinc-800">
                    ₹{(payModalUser.adjustedEntitlementPaise / 100).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Already Paid</span>
                  <span className="font-bold text-zinc-800">
                    ₹{(payModalUser.totalPaidPaise / 100).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Remaining Pending</span>
                  <span className="font-black text-rose-600">
                    ₹{(payModalUser.outstandingPaise / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSavePayout} className="mt-4 space-y-3.5">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700">Amount Being Paid Now</label>
                  <button
                    type="button"
                    onClick={() => setPayAmount((payModalUser.outstandingPaise / 100).toFixed(2))}
                    className="text-[10px] font-bold text-[#E61C5D] hover:underline"
                  >
                    Pay Full Pending
                  </button>
                </div>
                <div className="relative mt-1.5 flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-zinc-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={payModalUser.outstandingPaise / 100}
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-8 pr-3 text-sm font-black text-zinc-900 outline-none focus:border-rose-300"
                  />
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">
                  Partial payments will update the remaining balance and status automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-bold text-zinc-800 outline-none focus:border-rose-300"
                  >
                    <option value="BANK">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-medium text-zinc-800 outline-none focus:border-rose-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. UTR / UPI Ref / Cheque No."
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-medium text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">Admin Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Settle October incentives..."
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-medium text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalUser(null)}
                  className="w-1/2 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPay}
                  className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-[#156035] py-2.5 text-xs font-bold text-white hover:bg-[#0f4626] disabled:opacity-70 shadow-xs"
                >
                  {savingPay ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Settle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. View Details Full Modal / Drawer */}
      {detailsUserId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs"
          onClick={() => setDetailsUserId(null)}
        >
          <div
            className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h3 className="font-playfair text-xl font-bold text-zinc-900">
                  {detailsData?.user.name || "Employee Ledger"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {detailsData?.user.role === "MANAGER" ? "Manager" : "Field Officer"} · {detailsData?.user.phone || "No phone"} · Rate: ₹{detailsData?.user.effectiveRateRupees.toFixed(2)}/pkt
                </p>
              </div>
              <button
                onClick={() => setDetailsUserId(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin text-[#E61C5D]" />
                  <span>Loading complete financial ledger...</span>
                </div>
              </div>
            ) : detailsData ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Metric Strip */}
                <div className="grid grid-cols-4 gap-2 bg-[#FAF8F5] p-4 border-b border-zinc-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Entitlement</span>
                    <span className="font-black text-zinc-900 text-sm">
                      ₹{(detailsData.summary.adjustedEntitlementPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Disbursed (Paid)</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      ₹{(detailsData.summary.totalPaidPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Remaining Pending</span>
                    <span className="font-black text-rose-600 text-sm">
                      ₹{(detailsData.summary.outstandingPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Confirmed Packets</span>
                    <span className="font-bold text-zinc-800 text-sm">
                      {detailsData.summary.totalConfirmedPackets.toLocaleString("en-IN")} pkts
                    </span>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center border-b border-zinc-200 px-6 gap-6 text-xs font-bold text-zinc-600">
                  <button
                    onClick={() => setDetailsTab("months")}
                    className={`py-3 transition border-b-2 ${
                      detailsTab === "months"
                        ? "border-[#E61C5D] text-[#E61C5D]"
                        : "border-transparent hover:text-zinc-900"
                    }`}
                  >
                    Monthly Accounting ({detailsData.summary.periods.length})
                  </button>
                  <button
                    onClick={() => setDetailsTab("sales")}
                    className={`py-3 transition border-b-2 ${
                      detailsTab === "sales"
                        ? "border-[#E61C5D] text-[#E61C5D]"
                        : "border-transparent hover:text-zinc-900"
                    }`}
                  >
                    Confirmed Sales ({detailsData.sales.length})
                  </button>
                  <button
                    onClick={() => setDetailsTab("adjustments")}
                    className={`py-3 transition border-b-2 ${
                      detailsTab === "adjustments"
                        ? "border-[#E61C5D] text-[#E61C5D]"
                        : "border-transparent hover:text-zinc-900"
                    }`}
                  >
                    Adjustments ({detailsData.adjustments.length})
                  </button>
                  <button
                    onClick={() => setDetailsTab("payouts")}
                    className={`py-3 transition border-b-2 ${
                      detailsTab === "payouts"
                        ? "border-[#E61C5D] text-[#E61C5D]"
                        : "border-transparent hover:text-zinc-900"
                    }`}
                  >
                    Payment Settlements ({detailsData.payouts.length})
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-6">
                  {detailsTab === "months" && (
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="pb-3">Period</th>
                          <th className="pb-3 text-right">Packets</th>
                          <th className="pb-3 text-right">Earned</th>
                          <th className="pb-3 text-right">Adjustments</th>
                          <th className="pb-3 text-right">Entitlement</th>
                          <th className="pb-3 text-right">Paid</th>
                          <th className="pb-3 text-right">Pending</th>
                          <th className="pb-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {detailsData.summary.periods.map((p) => (
                          <tr key={`${p.year}-${p.month}`} className="hover:bg-zinc-50">
                            <td className="py-3 font-bold text-zinc-900">{p.label}</td>
                            <td className="py-3 text-right font-semibold">{p.confirmedPackets} pkts</td>
                            <td className="py-3 text-right">₹{(p.salesIncentivePaise / 100).toFixed(2)}</td>
                            <td className="py-3 text-right font-semibold">
                              {p.additionsPaise - p.deductionsPaise > 0 ? (
                                <span className="text-emerald-700">+₹{((p.additionsPaise - p.deductionsPaise) / 100).toFixed(2)}</span>
                              ) : p.additionsPaise - p.deductionsPaise < 0 ? (
                                <span className="text-rose-700">-₹{((p.deductionsPaise - p.additionsPaise) / 100).toFixed(2)}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-3 text-right font-bold text-zinc-900">
                              ₹{(p.adjustedEntitlementPaise / 100).toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-semibold text-emerald-800">
                              ₹{(p.allocatedPaidPaise / 100).toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-black">
                              <span className={p.outstandingPaise > 0 ? "text-rose-600" : "text-emerald-700"}>
                                ₹{(p.outstandingPaise / 100).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  p.status === "PAID"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : p.status === "PARTIALLY_PAID"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-rose-50 text-rose-800"
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {detailsTab === "sales" && (
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="pb-3">Customer Shop</th>
                          <th className="pb-3">Delivered Packets</th>
                          <th className="pb-3">Rate Applied</th>
                          <th className="pb-3">Confirmed Date</th>
                          <th className="pb-3 text-right">Incentive</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {detailsData.sales.map((s) => (
                          <tr key={s.id} className="hover:bg-zinc-50">
                            <td className="py-3">
                              <div className="font-bold text-zinc-900">{s.customer?.shopName || "Customer"}</div>
                              <div className="text-[10px] text-zinc-500">{s.customer?.contactName}</div>
                            </td>
                            <td className="py-3 font-semibold text-zinc-900">{s.quantity} pkts</td>
                            <td className="py-3 text-zinc-600">
                              {s.incentiveRatePaise ? `₹${(s.incentiveRatePaise / 100).toFixed(2)}/pkt` : "—"}
                            </td>
                            <td className="py-3 text-zinc-500">
                              {new Date(s.confirmedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3 text-right font-bold text-[#156035]">
                              ₹{((s.incentiveAmountPaise ?? 0) / 100).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        {detailsData.sales.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-400">
                              No confirmed incentive sales recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {detailsTab === "adjustments" && (
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Reason</th>
                          <th className="pb-3">Authorized By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {detailsData.adjustments.map((a) => (
                          <tr key={a.id} className="hover:bg-zinc-50">
                            <td className="py-3 font-medium text-zinc-700">
                              {new Date(a.adjustmentDate || a.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                                  a.type === "ADD" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                                }`}
                              >
                                {a.type}
                              </span>
                            </td>
                            <td className="py-3 font-bold text-zinc-900">
                              {a.type === "ADD" ? "+" : "-"}₹{(a.amountPaise / 100).toFixed(2)}
                            </td>
                            <td className="py-3 text-zinc-700">{a.reason}</td>
                            <td className="py-3 text-zinc-500">{a.createdBy?.name || "Admin"}</td>
                          </tr>
                        ))}
                        {detailsData.adjustments.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-400">
                              No manual incentive adjustments recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {detailsTab === "payouts" && (
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="pb-3">Payment Date</th>
                          <th className="pb-3">Method & Ref</th>
                          <th className="pb-3">Remarks</th>
                          <th className="pb-3">Period Allocations</th>
                          <th className="pb-3 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {detailsData.payouts.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-50">
                            <td className="py-3 font-medium text-zinc-700">
                              {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3">
                              <span className="font-bold text-zinc-900">{p.paymentMethod}</span>
                              {p.referenceId && (
                                <span className="block text-[10px] font-mono text-zinc-500">
                                  Ref: {p.referenceId}
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-zinc-700">{p.remarks || "—"}</td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                {(p.allocations || []).map((alloc, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-700"
                                  >
                                    {alloc.periodMonth}/{alloc.periodYear}: ₹{(alloc.amountPaise / 100).toFixed(2)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 text-right font-black text-emerald-800">
                              ₹{(p.amountPaise / 100).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        {detailsData.payouts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-400">
                              No payment disbursements recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Floating Notice Banner */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-60 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-xl ${
            notice.type === "success" ? "bg-[#156035]" : "bg-rose-700"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{notice.text}</span>
        </div>
      )}
    </DashboardShell>
  );
}
