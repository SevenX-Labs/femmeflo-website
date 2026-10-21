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
import { managerApi } from "@/lib/api/manager";
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

export default function ManagerShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<Shift | null>(null);

  const fetchShifts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await managerApi.listShifts({
        page,
        pageSize: 20,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
        to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
      });
      setShifts(res.items ?? res.shifts ?? []);
      setPagination(res.pagination);
    } catch (err) {
      console.warn("Failed to load manager shifts:", err);
    } finally {
      setLoading(false);
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
            onClick={() => fetchShifts(pagination.page)}
            disabled={loading}
            title="Refresh shifts"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
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
