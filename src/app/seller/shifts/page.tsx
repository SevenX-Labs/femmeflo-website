"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Filter,
  History,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  RotateCcw,
  Route,
  Store,
  X,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { SellerShiftWidget } from "@/components/shifts/SellerShiftWidget";
import { sellerApi } from "@/lib/api/seller";
import type { Shift, PaginationMeta, ShiftStatus } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

function formatLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDateRange(fromStr: string, toStr: string) {
  const [fy, fm, fd] = fromStr.split("-").map(Number);
  const [ty, tm, td] = toStr.split("-").map(Number);
  const start = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
  const end = new Date(ty, tm - 1, td, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

function formatDuration(startTime: string, endTime?: string | null): string {
  if (!endTime) return "In Progress";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  return `${h}h ${m}m`;
}

interface DayGroup {
  dateKey: string;
  dayLabel: string;
  formattedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  totalKm: number;
  totalStops: number;
  completedCount: number;
  shifts: Shift[];
}

export default function SellerShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<Shift | null>(null);

  // Date Presets & Filter State
  const [preset, setPreset] = useState<"ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [isRangeMode, setIsRangeMode] = useState<boolean>(false);
  const [singleDate, setSingleDate] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | "ALL">("ALL");

  // Date boundary strings in local time
  const todayYMD = useMemo(() => formatLocalYMD(new Date()), []);
  const yesterdayYMD = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatLocalYMD(d);
  }, []);
  const sevenDaysAgoYMD = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return formatLocalYMD(d);
  }, []);
  const monthStartYMD = useMemo(() => {
    const d = new Date();
    return formatLocalYMD(new Date(d.getFullYear(), d.getMonth(), 1));
  }, []);

  const fetchHistory = useCallback(
    async (
      page = 1,
      fDate = fromDate,
      tDate = toDate,
      status = statusFilter
    ) => {
      setLoading(true);
      try {
        let fromIso: string | undefined;
        let toIso: string | undefined;

        if (fDate && tDate) {
          const range = getLocalDateRange(fDate, tDate);
          fromIso = range.from;
          toIso = range.to;
        } else if (fDate) {
          const range = getLocalDateRange(fDate, fDate);
          fromIso = range.from;
          toIso = range.to;
        }

        const res = await sellerApi.getShiftHistory({
          page,
          pageSize: 20,
          from: fromIso,
          to: toIso,
          status: status === "ALL" ? undefined : status,
        });
        setShifts(res.items ?? res.shifts ?? []);
        setPagination(res.pagination);
      } catch (err) {
        console.warn("Failed to load shift history:", err);
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate, statusFilter]
  );

  useEffect(() => {
    fetchHistory(1, fromDate, toDate, statusFilter);
  }, [fromDate, toDate, statusFilter, fetchHistory]);

  // Apply Quick Preset
  const handleSelectPreset = (p: "ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH") => {
    setPreset(p);
    setIsRangeMode(false);
    if (p === "ALL") {
      setSingleDate("");
      setFromDate("");
      setToDate("");
    } else if (p === "TODAY") {
      setSingleDate(todayYMD);
      setFromDate(todayYMD);
      setToDate(todayYMD);
    } else if (p === "YESTERDAY") {
      setSingleDate(yesterdayYMD);
      setFromDate(yesterdayYMD);
      setToDate(yesterdayYMD);
    } else if (p === "THIS_WEEK") {
      setSingleDate("");
      setFromDate(sevenDaysAgoYMD);
      setToDate(todayYMD);
    } else if (p === "THIS_MONTH") {
      setSingleDate("");
      setFromDate(monthStartYMD);
      setToDate(todayYMD);
    }
  };

  // Single Day Picked
  const handleSingleDateChange = (val: string) => {
    setSingleDate(val);
    setFromDate(val);
    setToDate(val);
    if (!val) {
      setPreset("ALL");
    } else if (val === todayYMD) {
      setPreset("TODAY");
    } else if (val === yesterdayYMD) {
      setPreset("YESTERDAY");
    } else {
      setPreset("CUSTOM");
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setPreset("ALL");
    setSingleDate("");
    setFromDate("");
    setToDate("");
    setStatusFilter("ALL");
    setIsRangeMode(false);
  };

  const isFilterActive = Boolean(fromDate || toDate || statusFilter !== "ALL");

  // Summary stats across loaded shifts
  const totalKmSum = shifts.reduce((acc, s) => acc + (s.totalDistanceKm || 0), 0);
  const completedCount = shifts.filter((s) => s.status === "COMPLETED").length;
  const totalStopsCount = shifts.reduce((acc, s) => acc + (s.visits?.length || 0), 0);

  // Group shifts day-wise
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groupsMap = new Map<string, Shift[]>();

    for (const shift of shifts) {
      const d = new Date(shift.startTime);
      const key = formatLocalYMD(d);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(shift);
    }

    return Array.from(groupsMap.entries()).map(([dateKey, groupShifts]) => {
      const isToday = dateKey === todayYMD;
      const isYesterday = dateKey === yesterdayYMD;
      const [y, m, d] = dateKey.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);

      const formattedDate = dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const weekday = dateObj.toLocaleDateString("en-IN", { weekday: "short" });

      let dayLabel = `${weekday}, ${formattedDate}`;
      if (isToday) dayLabel = `Today · ${formattedDate}`;
      else if (isYesterday) dayLabel = `Yesterday · ${formattedDate}`;

      const totalKm = groupShifts.reduce((acc, s) => acc + (s.totalDistanceKm || 0), 0);
      const totalStops = groupShifts.reduce((acc, s) => acc + (s.visits?.length || 0), 0);
      const completedShifts = groupShifts.filter((s) => s.status === "COMPLETED").length;

      return {
        dateKey,
        dayLabel,
        formattedDate,
        isToday,
        isYesterday,
        totalKm,
        totalStops,
        completedCount: completedShifts,
        shifts: groupShifts,
      };
    });
  }, [shifts, todayYMD, yesterdayYMD]);

  // Active filter label for badges
  const activeFilterDescription = useMemo(() => {
    if (!fromDate && !toDate) return null;
    if (fromDate === toDate) {
      if (fromDate === todayYMD) return "Today";
      if (fromDate === yesterdayYMD) return "Yesterday";
      const [y, m, d] = fromDate.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return `${fromDate} to ${toDate}`;
  }, [fromDate, toDate, todayYMD, yesterdayYMD]);

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={user?.name ?? "Field Officer"}
      userDetail={["Officer", user?.village, user?.district].filter(Boolean).join(" · ")}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Field attendance & log"
        title="Duty Shifts & KM Ledger"
        description="Punch in your shift, log customer visits, and track official road kilometres for travel reimbursement."
        action={
          <button
            onClick={() => fetchHistory(pagination.page, fromDate, toDate, statusFilter)}
            disabled={loading}
            title="Refresh history"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
          </button>
        }
      />

      {/* 1. TOP LIVE SHIFT WIDGET */}
      <div className="mt-6">
        <SellerShiftWidget onShiftChange={() => fetchHistory(1, fromDate, toDate, statusFilter)} />
      </div>

      {/* 2. STATS ROW */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Distance</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-zinc-900">
            {totalKmSum.toFixed(1)} <span className="text-xs font-semibold text-zinc-500">KM</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {isFilterActive ? "Calculated for filter" : "Calculated across shifts"}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Completed Shifts</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#156035]">
            {completedCount} <span className="text-xs font-semibold text-zinc-500">{completedCount === 1 ? "shift" : "shifts"}</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Successfully closed shifts</p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Stops Visited</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#E61C5D]">
            {totalStopsCount} <span className="text-xs font-semibold text-zinc-500">shops</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Verified customer visits</p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rose-100 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg Distance / Shift</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#E61C5D]">
            {completedCount > 0 ? (totalKmSum / completedCount).toFixed(1) : "0.0"}{" "}
            <span className="text-xs font-semibold text-zinc-500">KM</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Average tour distance</p>
        </div>
      </div>

      {/* 3. DAY-WISE FILTER TOOLBAR */}
      <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top filter row: Presets + Status Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
          {/* Quick Day Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#E61C5D]" /> Day Filter:
            </span>
            <button
              type="button"
              onClick={() => handleSelectPreset("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                preset === "ALL" && !isRangeMode
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              All Days
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("TODAY")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                preset === "TODAY"
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("YESTERDAY")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                preset === "YESTERDAY"
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("THIS_WEEK")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                preset === "THIS_WEEK"
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("THIS_MONTH")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                preset === "THIS_MONTH"
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              This Month
            </button>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-1"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 self-start lg:self-auto rounded-xl bg-zinc-100 p-1">
            {(
              [
                { id: "ALL", label: "All Shifts" },
                { id: "ACTIVE", label: "Active Now" },
                { id: "COMPLETED", label: "Completed" },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  statusFilter === st.id
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom filter row: Single Day Date Picker OR Range Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {!isRangeMode ? (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 whitespace-nowrap">
                  <CalendarDays className="h-3.5 w-3.5 text-[#E61C5D]" />
                  Filter Specific Day:
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => handleSingleDateChange(e.target.value)}
                  className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300 transition cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 whitespace-nowrap">
                  <CalendarDays className="h-3.5 w-3.5 text-[#E61C5D]" />
                  From:
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPreset("CUSTOM");
                  }}
                  className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300 transition cursor-pointer"
                />
                <span className="text-xs text-zinc-400 font-bold">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPreset("CUSTOM");
                  }}
                  className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300 transition cursor-pointer"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setIsRangeMode(!isRangeMode);
                if (!isRangeMode) {
                  // Switching to range
                  setFromDate(singleDate || sevenDaysAgoYMD);
                  setToDate(todayYMD);
                  setPreset("CUSTOM");
                } else {
                  // Switching back to single day
                  setSingleDate(fromDate || todayYMD);
                  setFromDate(fromDate || todayYMD);
                  setToDate(fromDate || todayYMD);
                }
              }}
              className="text-[11px] font-bold text-zinc-600 hover:text-[#E61C5D] transition underline cursor-pointer ml-1"
            >
              {isRangeMode ? "Switch to Single Day" : "Switch to Date Range"}
            </button>
          </div>

          {/* Active Filter Badge */}
          {activeFilterDescription && (
            <div className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-3 py-1 text-xs font-bold text-[#E61C5D] self-start sm:self-auto">
              <span>Showing: {activeFilterDescription}</span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-full p-0.5 hover:bg-rose-100 transition cursor-pointer"
                title="Reset day filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. DAY-WISE SHIFTS HISTORY */}
      <SectionCard
        title="Shift Attendance History"
        description="Day-wise log of official field tours, shop visits, and travel reimbursement road kilometres"
        className="mt-6"
      >
        {loading && shifts.length === 0 ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#E61C5D]" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
              <Route className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-800">
              {activeFilterDescription
                ? `No shifts found for ${activeFilterDescription}`
                : "No shift history yet"}
            </h4>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              {activeFilterDescription
                ? "There were no duty shifts recorded for the selected date. Choose another day or clear the filter."
                : "Punch in your first shift above to start recording attendance and calculating travel kilometres."}
            </p>
            {isFilterActive && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:border-rose-200 hover:text-[#E61C5D] shadow-2xs transition cursor-pointer"
                >
                  Clear Date Filter
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("TODAY")}
                  className="rounded-xl bg-[#E61C5D] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#d01550] transition cursor-pointer"
                >
                  View Today
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 mt-3">
            {dayGroups.map((group) => (
              <div
                key={group.dateKey}
                className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs"
              >
                {/* DAY HEADER BAR */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-zinc-50/90 border-b border-zinc-200/80 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        group.isToday
                          ? "bg-rose-500 text-white"
                          : group.isYesterday
                          ? "bg-amber-500 text-white"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-zinc-900 tracking-tight flex items-center gap-2">
                        {group.dayLabel}
                        {group.isToday && (
                          <span className="rounded-full bg-rose-100 text-[#E61C5D] px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider">
                            Active Day
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>

                  {/* Day Aggregate Chips */}
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-zinc-200/80 px-2 py-0.5 text-[11px] text-zinc-700 shadow-2xs">
                      {group.shifts.length} {group.shifts.length === 1 ? "shift" : "shifts"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[11px] text-[#E61C5D] shadow-2xs">
                      <Store className="h-3 w-3" />
                      {group.totalStops} stops
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] text-emerald-800 shadow-2xs">
                      <Route className="h-3 w-3" />
                      {group.totalKm.toFixed(1)} km
                    </span>
                  </div>
                </div>

                {/* MOBILE CARDS FOR THIS DAY */}
                <div className="md:hidden p-3 space-y-3">
                  {group.shifts.map((s) => {
                    const isActive = s.status === "ACTIVE";
                    const startTimeStr = new Date(s.startTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const endTimeStr = s.endTime
                      ? new Date(s.endTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Active Now";

                    return (
                      <div
                        key={s.id}
                        className="rounded-xl border border-zinc-200/70 bg-zinc-50/40 p-3.5 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                            <Clock className="h-3.5 w-3.5 text-[#E61C5D]" />
                            <span>
                              {startTimeStr} &rarr; {endTimeStr}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
                            {s.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-lg bg-white border border-zinc-100 p-2 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Duration</span>
                            <span className="font-bold text-zinc-800">{formatDuration(s.startTime, s.endTime)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Stops</span>
                            <span className="font-bold text-zinc-800">{s.visits?.length ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Distance</span>
                            <span className="font-bold text-[#E61C5D]">{s.totalDistanceKm} km</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 text-[11px] text-zinc-500">
                          <span className="font-mono text-[10px] truncate max-w-[170px]">
                            {s.startAddress ? s.startAddress : `GPS: ${s.startLatitude.toFixed(2)}, ${s.startLongitude.toFixed(2)}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedShiftForDetails(s)}
                            className="font-bold text-[#E61C5D] hover:underline cursor-pointer"
                          >
                            View Stops &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP TABLE FOR THIS DAY */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-400 bg-white">
                        <th className="py-2.5 px-4">Timings</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Start Location</th>
                        <th className="py-2.5 px-3 text-center">Stops Visited</th>
                        <th className="py-2.5 px-3 text-right">Road Distance</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {group.shifts.map((s) => {
                        const isActive = s.status === "ACTIVE";
                        const startTimeStr = new Date(s.startTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const endTimeStr = s.endTime
                          ? new Date(s.endTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Active Now";

                        return (
                          <tr key={s.id} className="hover:bg-zinc-50/70 transition">
                            <td className="py-3 px-4 font-bold text-zinc-900">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                <span>{startTimeStr}</span>
                                <span className="text-zinc-400">&rarr;</span>
                                <span className={isActive ? "text-emerald-600 font-bold" : "text-zinc-700"}>
                                  {endTimeStr}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-medium text-zinc-700">
                              {formatDuration(s.startTime, s.endTime)}
                            </td>
                            <td className="py-3 px-3 text-zinc-600 font-mono text-[11px] max-w-xs truncate">
                              {s.startAddress ? (
                                s.startAddress
                              ) : (
                                <span>{s.startLatitude.toFixed(3)}, {s.startLongitude.toFixed(3)}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-[#E61C5D]">
                                <Store className="h-3 w-3" />
                                {s.visits?.length ?? 0}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-zinc-900">
                              <span className="text-[#E61C5D]">{s.totalDistanceKm}</span> km
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-zinc-100 text-zinc-700"
                                }`}
                              >
                                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedShiftForDetails(s)}
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-800 hover:border-rose-200 hover:text-[#E61C5D] hover:bg-rose-50/50 transition cursor-pointer shadow-2xs"
                              >
                                <Route className="h-3 w-3" /> Stops
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                <span className="text-zinc-500">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} shifts)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => fetchHistory(pagination.page - 1, fromDate, toDate, statusFilter)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() => fetchHistory(pagination.page + 1, fromDate, toDate, statusFilter)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* SHIFT DETAILS MODAL */}
      {selectedShiftForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                  <Route className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Shift Route &amp; Visits</h3>
                  <p className="text-xs text-zinc-500">
                    {new Date(selectedShiftForDetails.startTime).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })} · Total: {selectedShiftForDetails.totalDistanceKm} km
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShiftForDetails(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto flex-1 pr-1 space-y-3">
              {/* Timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-rose-100">
                {/* 1. Start */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
                    S
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900">Shift Started</span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {new Date(selectedShiftForDetails.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                      GPS: {selectedShiftForDetails.startLatitude.toFixed(4)}, {selectedShiftForDetails.startLongitude.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* 2. Shop Visits */}
                {selectedShiftForDetails.visits?.map((v, idx) => (
                  <div key={v.id} className="relative">
                    <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E61C5D] text-white text-[10px] font-bold shadow-xs">
                      {idx + 1}
                    </span>
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-900">{v.shopName}</span>
                        <span className="font-mono text-[11px] text-zinc-500">
                          {new Date(v.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {v.notes && (
                        <p className="text-[11px] text-zinc-600 mt-1 italic">&ldquo;{v.notes}&rdquo;</p>
                      )}
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        GPS: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* 3. End */}
                {selectedShiftForDetails.endTime ? (
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-white text-[10px] font-bold shadow-xs">
                      E
                    </span>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-900">Shift Ended</span>
                        <span className="font-mono text-[11px] text-zinc-500">
                          {new Date(selectedShiftForDetails.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {selectedShiftForDetails.endLatitude && selectedShiftForDetails.endLongitude && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                          GPS: {selectedShiftForDetails.endLatitude.toFixed(4)}, {selectedShiftForDetails.endLongitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-white text-[10px] font-bold animate-pulse">
                      ...
                    </span>
                    <p className="text-xs font-semibold text-emerald-700">Currently On Field</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-zinc-700">
                Road Route Distance: <span className="text-[#E61C5D] font-extrabold">{selectedShiftForDetails.totalDistanceKm} km</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedShiftForDetails(null)}
                className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
