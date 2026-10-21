"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  RotateCcw,
  Route,
  Search,
  Store,
  Users,
  X,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { clearApiCache } from "@/lib/api/client";
import { adminApi } from "@/lib/api/admin";
import type { Shift, PaginationMeta, ShiftStatus } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

function formatDuration(startTime: string, endTime?: string | null): string {
  if (!endTime) return "Active now";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  return `${h}h ${m}m`;
}

// Module-level persistent cache for admin shifts
let cachedAdminShifts: Shift[] = [];
let cachedShiftsPagination: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

export default function AdminShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>(cachedAdminShifts);
  const [pagination, setPagination] = useState<PaginationMeta>(cachedShiftsPagination);
  const [loading, setLoading] = useState(cachedAdminShifts.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<Shift | null>(null);

  // Date preset detection helpers
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const activeDatePreset = useMemo(() => {
    if (!fromDate || !toDate) return null;
    if (fromDate === todayStr && toDate === todayStr) return "today";
    if (fromDate === sevenDaysAgoStr && toDate === todayStr) return "7days";
    if (fromDate === thirtyDaysAgoStr && toDate === todayStr) return "30days";
    return "custom";
  }, [fromDate, toDate, todayStr, sevenDaysAgoStr, thirtyDaysAgoStr]);

  const fetchShifts = async (page = 1, isManual = false) => {
    if (isManual || cachedAdminShifts.length === 0) {
      if (cachedAdminShifts.length > 0) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
    }
    try {
      const res = await adminApi.listShifts({
        page,
        pageSize: 20,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
        to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
      });
      const items = res.items ?? res.shifts ?? [];
      setShifts(items);
      setPagination(res.pagination);
      if (page === 1 && statusFilter === "ALL" && !fromDate && !toDate) {
        cachedAdminShifts = items;
        cachedShiftsPagination = res.pagination;
      }
    } catch (err) {
      console.warn("Failed to load admin shifts:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShifts(1);
  }, [statusFilter, fromDate, toDate]);

  const filteredShifts = useMemo(() => {
    if (!searchQuery.trim()) return shifts;
    const q = searchQuery.toLowerCase();
    return shifts.filter(
      (s) =>
        s.seller?.name.toLowerCase().includes(q) ||
        s.seller?.phone?.includes(q) ||
        s.seller?.employeeCode?.toLowerCase().includes(q)
    );
  }, [shifts, searchQuery]);

  // Aggregate stats across loaded items
  const activeNowCount = shifts.filter((s) => s.status === "ACTIVE").length;
  const completedCount = shifts.filter((s) => s.status === "COMPLETED").length;
  const totalKmCalculated = shifts.reduce((acc, s) => acc + (s.totalDistanceKm || 0), 0);
  const avgKm = completedCount > 0 ? (totalKmCalculated / completedCount).toFixed(1) : "0.0";

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName={user?.name ?? "Super Admin"}
      userDetail="Central Command"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Fleet & field operations"
        title="Field Officer Shifts & KM Ledger"
        description="Monitor field staff login/logout attendance, verified customer check-ins, and accurate road travel kilometres."
        action={
          <button
            onClick={() => {
              clearApiCache();
              cachedAdminShifts = [];
              fetchShifts(pagination.page, true);
            }}
            disabled={loading || isRefreshing}
            title="Refresh shifts"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? "animate-spin text-[#E61C5D]" : ""}`} />
          </button>
        }
      />

      {/* KPI METRICS */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active On Field Now"
          value={activeNowCount.toString()}
          note="Officers currently on active shift"
          icon="chart"
          tone="green"
        />
        <MetricCard
          label="Completed Shifts"
          value={completedCount.toString()}
          note="Verified full shift logs"
          icon="package"
          tone="rose"
        />
        <MetricCard
          label="Total Road Distance"
          value={`${totalKmCalculated.toFixed(1)} km`}
          note="Official calculated route distance"
          icon="truck"
          tone="amber"
        />
        <MetricCard
          label="Avg Distance / Shift"
          value={`${avgKm} km`}
          note="Average route kilometres per tour"
          icon="trend"
          tone="green"
        />
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#E61C5D]" /> Date Range:
            </span>
            <button
              type="button"
              onClick={() => {
                setFromDate(todayStr);
                setToDate(todayStr);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                activeDatePreset === "today"
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate(sevenDaysAgoStr);
                setToDate(todayStr);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                activeDatePreset === "7days"
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate(thirtyDaysAgoStr);
                setToDate(todayStr);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                activeDatePreset === "30days"
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              Last 30 Days
            </button>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="text-xs font-bold text-zinc-500 hover:text-rose-600 underline ml-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status selector tabs */}
          <div className="flex items-center gap-1 self-start md:self-auto rounded-xl bg-zinc-100 p-1">
            {(["ALL", "ACTIVE", "COMPLETED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                {st === "ALL" ? "All Shifts" : st === "ACTIVE" ? "Active Now" : "Completed"}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Custom Date Inputs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search officer name, phone, code..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-8.5 pr-3 text-xs font-semibold outline-none focus:border-rose-300"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-2 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
            />
            <span className="text-xs text-zinc-400 font-bold">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-2 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
            />
          </div>
        </div>
      </div>

      {/* SHIFTS LEDGER TABLE */}
      <SectionCard
        title="Field Officer Attendance & Tour Ledger"
        description="Daily start/end stamps, customer check-ins, and calculated distance"
        className="mt-6"
      >
        {loading && shifts.length === 0 ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#E61C5D]" />
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
              <Route className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-800">No shift records match this filter</h4>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting the date range or status filter to see officers shift history.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS */}
            <div className="md:hidden space-y-3 mt-3">
              {filteredShifts.map((s) => {
                const isActive = s.status === "ACTIVE";
                const dateStr = new Date(s.startTime).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                });
                const startTimeStr = new Date(s.startTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const endTimeStr = s.endTime
                  ? new Date(s.endTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "On Field";

                return (
                  <div key={s.id} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-950">{s.seller?.name || "Unknown Officer"}</h4>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          {s.seller?.phone || "No phone"} {s.seller?.employeeCode ? `· ${s.seller.employeeCode}` : ""}
                        </p>
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

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2.5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Date</span>
                        <span className="font-bold text-zinc-800">{dateStr}</span>
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

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[11px] text-zinc-500">
                      <span>{startTimeStr} – {endTimeStr}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedShiftForDetails(s)}
                        className="font-bold text-[#E61C5D] hover:underline"
                      >
                        Inspect Route &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto mt-3">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-3">Field Officer</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Duty Hours</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3 text-center">Shop Stops</th>
                    <th className="py-3 px-3 text-right">Road KM</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Route Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredShifts.map((s) => {
                    const isActive = s.status === "ACTIVE";
                    const dateStr = new Date(s.startTime).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    const startTimeStr = new Date(s.startTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const endTimeStr = s.endTime
                      ? new Date(s.endTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <tr key={s.id} className="hover:bg-zinc-50/60 transition">
                        <td className="py-3 px-3">
                          <span className="font-bold text-zinc-950 block">{s.seller?.name || "Field Officer"}</span>
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {s.seller?.phone || "No phone"} {s.seller?.employeeCode ? `· ${s.seller.employeeCode}` : ""}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-zinc-800">{dateStr}</td>
                        <td className="py-3 px-3 text-zinc-600 font-medium">
                          {startTimeStr} &rarr; {endTimeStr}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-zinc-700">
                          {formatDuration(s.startTime, s.endTime)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D]">
                            <Store className="h-3 w-3" />
                            {s.visits?.length ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-zinc-900">
                          <span className="text-[#E61C5D] font-extrabold">{s.totalDistanceKm}</span> km
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
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedShiftForDetails(s)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-800 hover:border-rose-200 hover:text-[#E61C5D] hover:bg-rose-50/50 transition cursor-pointer shadow-2xs"
                          >
                            <Route className="h-3 w-3 text-zinc-500" /> Audit Stops
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                <span className="text-zinc-500">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} shifts)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => fetchShifts(pagination.page - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() => fetchShifts(pagination.page + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* ROUTE AUDIT MODAL */}
      {selectedShiftForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                  <Route className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Shift Route Audit</h3>
                  <p className="text-xs text-zinc-500">
                    Officer: <strong>{selectedShiftForDetails.seller?.name || "Field Officer"}</strong> · {selectedShiftForDetails.totalDistanceKm} km
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
                    <p className="text-xs font-semibold text-emerald-700">Currently On Duty</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-zinc-700">
                Total Route KM: <span className="text-[#E61C5D] font-extrabold">{selectedShiftForDetails.totalDistanceKm} km</span>
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
