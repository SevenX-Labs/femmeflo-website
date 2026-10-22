"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
  Search,
  Store,
  Users,
  X,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { clearApiCache } from "@/lib/api/client";
import { managerApi } from "@/lib/api/manager";
import type { Shift, PaginationMeta, ShiftStatus } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

function formatMinutes(mins: number | null | undefined): string {
  if (mins === null || mins === undefined) return "In progress";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatDuration(startTime: string, endTime?: string | null): string {
  if (!endTime) return "Active now";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  return `${h}h ${m}m`;
}

// Persistent cache for manager shifts
let cachedManagerShifts: Shift[] = [];
let cachedManagerShiftsPagination: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

export default function ManagerShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>(cachedManagerShifts);
  const [pagination, setPagination] = useState<PaginationMeta>(cachedManagerShiftsPagination);
  const [loading, setLoading] = useState(cachedManagerShifts.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<Shift | null>(null);

  const fetchShifts = async (page = 1, isManual = false) => {
    if (isManual || cachedManagerShifts.length === 0) {
      if (cachedManagerShifts.length > 0) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
    }
    try {
      const res = await managerApi.listShifts({
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
        cachedManagerShifts = items;
        cachedManagerShiftsPagination = res.pagination;
      }
    } catch (err) {
      console.warn("Failed to load manager shifts:", err);
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

  const activeNowCount = shifts.filter((s) => s.status === "ACTIVE").length;
  const completedCount = shifts.filter((s) => s.status === "COMPLETED").length;
  const totalKmCalculated = shifts.reduce((acc, s) => acc + (s.totalDistanceKm || 0), 0);

  return (
    <DashboardShell
      role="Manager"
      workspace="Manager workspace"
      userName={user?.name ?? "Regional Manager"}
      userDetail={["Manager", user?.district, user?.state].filter(Boolean).join(" · ")}
      navigation={getManagerNavigation(user)}
    >
      <PageHeading
        eyebrow="Team attendance & oversight"
        title="Field Officers Shifts & KM Tracker"
        description="Monitor your assigned officers daily field login, customer check-ins, and verified travel distance."
        action={
          <button
            onClick={() => {
              clearApiCache();
              cachedManagerShifts = [];
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

      {/* KPI STATS */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Active Officers Today"
          value={activeNowCount.toString()}
          note="Officers currently on field duty"
          icon="chart"
          tone="green"
        />
        <MetricCard
          label="Completed Shifts"
          value={completedCount.toString()}
          note="Shifts closed and calculated"
          icon="package"
          tone="rose"
        />
        <MetricCard
          label="Team Road Distance"
          value={`${totalKmCalculated.toFixed(1)} km`}
          note="Cumulative travel distance"
          icon="truck"
          tone="amber"
        />
      </div>

      {/* FILTERS */}
      <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search officer by name, phone..."
            className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-8.5 pr-3 text-xs font-semibold outline-none focus:border-rose-300"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["ALL", "ACTIVE", "COMPLETED"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#E61C5D] text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {st === "ALL" ? "All" : st === "ACTIVE" ? "Active" : "Closed"}
            </button>
          ))}
        </div>
      </div>

      {/* LEDGER */}
      <SectionCard
        title="Field Officer Attendance & Tour Records"
        description="Verify daily check-ins and travel claims"
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
            <h4 className="mt-3 text-sm font-bold text-zinc-800">No shift records found</h4>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              No field shift records match your selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-3">Field Officer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Duty Hours</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3 text-center">Stops</th>
                  <th className="py-3 px-3 text-right">Road KM</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Stops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
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
                    <tr key={s.id} className="hover:bg-zinc-50/60 transition">
                      <td className="py-3 px-3">
                        <span className="font-bold text-zinc-950 block">{s.seller?.name || "Officer"}</span>
                        <span className="text-[11px] text-zinc-400">{s.seller?.phone || "No phone"}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-800">{dateStr}</td>
                      <td className="py-3 px-3 text-zinc-600">
                        {startTimeStr} &rarr; {endTimeStr}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-zinc-700">
                        {formatDuration(s.startTime, s.endTime)}
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
                      <td className="py-3 px-3 text-center">
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
        )}
      </SectionCard>

      {/* ROUTE MODAL */}
      {selectedShiftForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                  <Route className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Shift Route Details</h3>
                  <p className="text-xs text-zinc-500">
                    Officer: <strong>{selectedShiftForDetails.seller?.name || "Officer"}</strong> · {selectedShiftForDetails.totalDistanceKm} km
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

            {/* TIMING SUMMARY METRICS */}
            {selectedShiftForDetails.timing && (
              <div className="mt-3 shrink-0 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#E61C5D]" /> Officer Timing Breakdown
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    {selectedShiftForDetails.timing.visitCount} {selectedShiftForDetails.timing.visitCount === 1 ? "shop visited" : "shops visited"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-white border border-zinc-200/70 p-2 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-600 block">Total Shift</span>
                    <span className="font-extrabold text-xs text-zinc-900 font-mono mt-0.5 block">
                      {formatMinutes(selectedShiftForDetails.timing.totalShiftMins)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-emerald-200/80 p-2 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Time at Shops</span>
                    <span className="font-extrabold text-xs text-emerald-700 font-mono mt-0.5 block">
                      {formatMinutes(selectedShiftForDetails.timing.totalVisitMins)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-amber-200/80 p-2 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Travel Time</span>
                    <span className="font-extrabold text-xs text-amber-700 font-mono mt-0.5 block">
                      {formatMinutes(selectedShiftForDetails.timing.travelMins)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-zinc-200/70 p-2 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-600 block">Shops Visited</span>
                    <span className="font-extrabold text-xs text-zinc-900 font-mono mt-0.5 block">
                      {selectedShiftForDetails.timing.visitCount}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 overflow-y-auto flex-1 pr-1 space-y-3">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-rose-100">
                {/* Start */}
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

                {/* Visits */}
                {selectedShiftForDetails.visits?.map((v, idx) => {
                  const hasCheckOut = Boolean(v.checkOutTime);
                  const isOngoing = !hasCheckOut && selectedShiftForDetails.status === "ACTIVE";
                  const arrivedStr = new Date(v.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                  const leftStr = v.checkOutTime
                    ? new Date(v.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : (isOngoing ? "At Shop" : "—");

                  return (
                    <div key={v.id} className="relative">
                      <span className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold shadow-xs ${
                        isOngoing ? "bg-emerald-500 animate-pulse" : "bg-[#E61C5D]"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className={`rounded-xl border p-3 ${
                        isOngoing
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-zinc-200/80 bg-zinc-50/70"
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-900">{v.shopName}</span>
                              {isOngoing && (
                                <span className="rounded-full bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                                  Current
                                </span>
                              )}
                            </div>
                            {v.customer?.phone && (
                              <span className="text-[10px] text-zinc-500">Ph: {v.customer.phone}</span>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-mono font-bold ${
                            isOngoing
                              ? "bg-emerald-100 text-emerald-800"
                              : v.durationMins != null
                              ? "bg-white border border-zinc-200 text-zinc-800"
                              : "bg-zinc-100 text-zinc-500"
                          }`}>
                            <Clock className="h-3 w-3" />
                            {v.durationMins != null ? formatMinutes(v.durationMins) : (isOngoing ? "In progress" : "No timing data")}
                          </span>
                        </div>

                        {/* Timing details row */}
                        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-white/80 border border-zinc-200/60 p-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase block">Arrived</span>
                            <span className="font-mono text-zinc-800 font-semibold">{arrivedStr}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase block">Left</span>
                            <span className="font-mono text-zinc-800 font-semibold">{leftStr}</span>
                          </div>
                        </div>

                        {v.notes && (
                          <p className="text-[11px] text-zinc-600 mt-1.5 italic">&ldquo;{v.notes}&rdquo;</p>
                        )}
                        <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                          GPS: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* End */}
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
                Calculated Distance: <span className="text-[#E61C5D] font-extrabold">{selectedShiftForDetails.totalDistanceKm} km</span>
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
