"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  History,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Store,
  X,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { SellerShiftWidget } from "@/components/shifts/SellerShiftWidget";
import { sellerApi } from "@/lib/api/seller";
import type { Shift, PaginationMeta } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

function formatDuration(startTime: string, endTime?: string | null): string {
  if (!endTime) return "In Progress";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function SellerShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<Shift | null>(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await sellerApi.getShiftHistory({ page, pageSize: 15 });
      setShifts(res.items ?? res.shifts ?? []);
      setPagination(res.pagination);
    } catch (err) {
      console.warn("Failed to load shift history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const totalKmSum = shifts.reduce((acc, s) => acc + (s.totalDistanceKm || 0), 0);
  const completedCount = shifts.filter((s) => s.status === "COMPLETED").length;

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
            onClick={() => fetchHistory(pagination.page)}
            disabled={loading}
            title="Refresh history"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
          </button>
        }
      />

      {/* 1. TOP LIVE SHIFT WIDGET */}
      <div className="mt-6">
        <SellerShiftWidget onShiftChange={() => fetchHistory(1)} />
      </div>

      {/* 2. STATS ROW */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Distance</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-zinc-900">
            {totalKmSum.toFixed(1)} <span className="text-xs font-semibold text-zinc-500">KM</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Calculated across loaded shifts</p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Completed Shifts</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#156035]">
            {completedCount} <span className="text-xs font-semibold text-zinc-500">days</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Successfully closed shifts</p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rose-100 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg Distance / Day</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#E61C5D]">
            {completedCount > 0 ? (totalKmSum / completedCount).toFixed(1) : "0.0"} <span className="text-xs font-semibold text-zinc-500">KM</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Average field tour distance</p>
        </div>
      </div>

      {/* 3. SHIFTS HISTORY TABLE */}
      <SectionCard
        title="Shift Attendance History"
        description="Records of start and end times, shop stops, and road kilometres"
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
            <h4 className="mt-3 text-sm font-bold text-zinc-800">No shift history yet</h4>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Punch in your first shift above to start recording attendance and calculating travel kilometres.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS */}
            <div className="md:hidden space-y-3 mt-3">
              {shifts.map((s) => {
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
                  : "Active";

                return (
                  <div key={s.id} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#E61C5D]" />
                        <span className="font-bold text-xs text-zinc-900">{dateStr}</span>
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
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Hours</span>
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

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[11px] text-zinc-500">
                      <span>{startTimeStr} – {endTimeStr}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedShiftForDetails(s)}
                        className="font-bold text-[#E61C5D] hover:underline"
                      >
                        View Stops &rarr;
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
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Timings</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3 text-center">Stops Visited</th>
                    <th className="py-3 px-3 text-right">Road Distance</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {shifts.map((s) => {
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
                        <td className="py-3 px-3 font-bold text-zinc-900">{dateStr}</td>
                        <td className="py-3 px-3 text-zinc-700">
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

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                <span className="text-zinc-500">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} shifts)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => fetchHistory(pagination.page - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() => fetchHistory(pagination.page + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
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
