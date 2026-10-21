"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass,
  Loader2,
  MapPin,
  Navigation,
  Play,
  Route,
  Square,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { sellerApi } from "@/lib/api/seller";
import type { CustomerItem, Shift } from "@/lib/api/types";

function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === 1) {
          reject(new Error("Location access was denied. Please allow location permissions in your browser."));
        } else if (err.code === 2) {
          reject(new Error("Location is unavailable. Please check your phone GPS settings."));
        } else {
          reject(new Error("Location request timed out. Please try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface SellerShiftWidgetProps {
  onShiftChange?: (shift: Shift | null) => void;
  compact?: boolean;
}

export function SellerShiftWidget({ onShiftChange, compact = false }: SellerShiftWidgetProps) {
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check in form state
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customShopName, setCustomShopName] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch current shift
  const fetchCurrentShift = async () => {
    try {
      setError(null);
      const res = await sellerApi.getCurrentShift();
      const current = res.shift ?? null;
      setShift(current);
      if (onShiftChange) onShiftChange(current);
    } catch (err: unknown) {
      console.warn("Failed to fetch current shift:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentShift();
  }, []);

  // Timer effect when shift is active
  useEffect(() => {
    if (!shift || shift.status !== "ACTIVE") {
      setElapsedSeconds(0);
      return;
    }
    const startMs = new Date(shift.startTime).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [shift]);

  // Load customers for check-in picker
  const loadCustomers = async () => {
    try {
      const res = await sellerApi.listCustomers({ pageSize: 50 });
      setCustomers(res.customers ?? res.items ?? []);
    } catch {
      // Ignored
    }
  };

  const handleStartShift = async () => {
    setIsSubmitting(true);
    setError(null);
    setActionSuccess(null);
    try {
      const coords = await getCurrentCoordinates();
      const res = await sellerApi.startShift({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setShift(res.shift);
      setActionSuccess("Shift started! Location and time captured.");
      if (onShiftChange) onShiftChange(res.shift);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start shift.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCheckIn = () => {
    setShowCheckInModal(true);
    setSelectedCustomerId("");
    setCustomShopName("");
    setVisitNotes("");
    setError(null);
    loadCustomers();
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const shop = selectedCustomerId
      ? customers.find((c) => c.id === selectedCustomerId)?.shopName || "Retail Customer"
      : customShopName.trim();

    if (!shop) {
      setError("Please select or enter a shop name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const coords = await getCurrentCoordinates();
      await sellerApi.checkIn({
        latitude: coords.latitude,
        longitude: coords.longitude,
        shopName: shop,
        customerId: selectedCustomerId || undefined,
        notes: visitNotes.trim() || undefined,
      });
      setShowCheckInModal(false);
      setActionSuccess(`Check-in recorded at ${shop}!`);
      await fetchCurrentShift();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record check-in.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEndShift = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const coords = await getCurrentCoordinates();
      const res = await sellerApi.endShift({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setShowEndModal(false);
      setShift(null);
      if (onShiftChange) onShiftChange(null);
      setActionSuccess(`Shift ended! Total route distance: ${res.shift.totalDistanceKm} km.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to end shift.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const visitsCount = shift?.visits?.length ?? 0;

  return (
    <>
      <div className="rounded-2xl border border-rose-100 bg-white p-4 sm:p-5 shadow-xs transition-all">
        {/* Alerts */}
        {actionSuccess && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-3 flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs font-semibold text-rose-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#E61C5D]" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {shift && shift.status === "ACTIVE" ? (
          // ACTIVE SHIFT VIEW
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-950">Duty Shift Active</h3>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      On Field
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Started at {new Date(shift.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Running Timer */}
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 self-start sm:self-auto shadow-2xs">
                <Clock className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span className="font-mono text-xs font-bold text-zinc-800">{formatDuration(elapsedSeconds)}</span>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#FFF8FA] border border-rose-100 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Shops Visited</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Store className="h-4 w-4 text-[#E61C5D]" />
                  <span className="text-lg font-black text-zinc-900">{visitsCount}</span>
                  <span className="text-xs text-zinc-500 font-medium">stops logged</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#FFF8FA] border border-rose-100 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Start Point</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Compass className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-zinc-800 font-mono truncate">
                    {shift.startLatitude.toFixed(3)}, {shift.startLongitude.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleOpenCheckIn}
                disabled={isSubmitting}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(230,28,93,0.2)] hover:bg-[#cf1550] transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <MapPin className="h-4 w-4" />
                <span>Check In at Shop</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEndModal(true)}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-800 hover:bg-rose-50 hover:border-rose-200 hover:text-[#E61C5D] transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Square className="h-3.5 w-3.5 text-zinc-500" />
                <span>End Shift</span>
              </button>

              <Link
                href="/seller/shifts"
                className="text-xs font-bold text-zinc-500 hover:text-[#E61C5D] underline ml-auto py-1"
              >
                Shift history &rarr;
              </Link>
            </div>
          </div>
        ) : (
          // NOT STARTED / IDLE VIEW
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#E61C5D] border border-rose-100 shadow-2xs">
                <Navigation className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-950">Ready to begin your day?</h3>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                    Shift Off
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 max-w-md">
                  Punch in your shift to log visits, track customer check-ins, and calculate your daily travel kilometres.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={handleStartShift}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#156035] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(21,96,53,0.2)] hover:bg-[#0f4626] transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Getting GPS...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Start Shift</span>
                  </>
                )}
              </button>

              {!compact && (
                <Link
                  href="/seller/shifts"
                  className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-bold text-zinc-700 hover:border-rose-200 hover:text-[#E61C5D] transition shadow-2xs"
                >
                  <Route className="h-3.5 w-3.5" />
                  <span>Log</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CHECK-IN MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
                  <MapPin className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Shop Check-In</h3>
                  <p className="text-xs text-zinc-500">Log your visit at this customer location</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckIn} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800">Select Existing Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    if (e.target.value) setCustomShopName("");
                  }}
                  className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
                >
                  <option value="">-- Choose from your customer list --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shopName} ({c.contactName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800">Or Enter Shop / Store Name</label>
                <input
                  type="text"
                  value={customShopName}
                  onChange={(e) => {
                    setCustomShopName(e.target.value);
                    if (e.target.value) setSelectedCustomerId("");
                  }}
                  placeholder="e.g. Balaji Medical Store"
                  className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800">Visit Notes (Optional)</label>
                <input
                  type="text"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="e.g. Order booked, samples provided, shop closed..."
                  className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/80 text-[11px] text-zinc-500 flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#E61C5D] shrink-0" />
                <span>Your exact GPS location will be captured at this moment to record your route.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="h-9 rounded-xl px-3.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!selectedCustomerId && !customShopName.trim())}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#cf1550] disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Confirm Check-In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END SHIFT MODAL */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Square className="h-4 w-4 fill-amber-700" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">End Today's Shift</h3>
                  <p className="text-xs text-zinc-500">Finalize duties and calculate total travel KM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Total Time on Field:</span>
                  <span className="font-bold font-mono text-zinc-900">{formatDuration(elapsedSeconds)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Total Stops Visited:</span>
                  <span className="font-bold text-zinc-900">{visitsCount} retail locations</span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                When you press confirm, the system will record your final destination and calculate the official road route kilometres between all your visited stops for travel reimbursement.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="h-9 rounded-xl px-3.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmEndShift}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Calculating KM...</span>
                    </>
                  ) : (
                    <>
                      <Square className="h-3.5 w-3.5 fill-white" />
                      <span>Confirm &amp; End Shift</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
