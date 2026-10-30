"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ScanFace,
  CheckCircle2,
  Clock,
  Compass,
  Hourglass,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  ShoppingBag,
  Navigation,
  Play,
  Route,
  Square,
  Store,
  Timer,
  X,
} from "lucide-react";
import Link from "next/link";
import { sellerApi } from "@/lib/api/seller";
import type { CustomerItem, Shift, ShiftVisit, ProductItem, PaymentMode } from "@/lib/api/types";
import { webNotificationService } from "@/lib/notifications/webNotifications";
import { useAuth } from "@/context/AuthContext";
import { FaceVerificationModal, type FaceVerificationResult } from "./FaceVerificationModal";

function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    const onPos = (pos: GeolocationPosition) => {
      resolve({
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
      });
    };
    navigator.geolocation.getCurrentPosition(
      onPos,
      (err) => {
        if (err.code === 1) {
          reject(new Error("Location access was denied. Please allow location permissions in your browser."));
        } else {
          // Cellular / WiFi tower fallback for indoor / satellite timeout on Apple devices
          navigator.geolocation.getCurrentPosition(
            onPos,
            () => reject(new Error("Location is unavailable. Please check your phone GPS settings.")),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
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

export function formatMinutes(mins: number | null | undefined): string {
  if (mins === null || mins === undefined) return "In progress";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

interface SellerShiftWidgetProps {
  onShiftChange?: (shift: Shift | null) => void;
  compact?: boolean;
}

// Persistent cache for active shift state
let cachedActiveShift: Shift | null = null;
let hasLoadedShiftOnce = false;

export function SellerShiftWidget({ onShiftChange, compact = false }: SellerShiftWidgetProps) {
  const [shift, setShift] = useState<Shift | null>(cachedActiveShift);
  const [loading, setLoading] = useState(!hasLoadedShiftOnce);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [faceModalMode, setFaceModalMode] = useState<"START" | "END" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Check in form state
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customShopName, setCustomShopName] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  // Check out state
  const [checkOutNotes, setCheckOutNotes] = useState("");
  const [checkOutSaleDone, setCheckOutSaleDone] = useState(false);
  const [checkOutFeedback, setCheckOutFeedback] = useState("");
  const [checkOutCustomerId, setCheckOutCustomerId] = useState("");
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string | null; basePricePaise: number; minimumPricePaise: number }>>([]);
  const [productStocks, setProductStocks] = useState<Array<{ productId: string; balance: number }>>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleUnitPrice, setSaleUnitPrice] = useState(25);
  const [salePaymentMode, setSalePaymentMode] = useState<PaymentMode>("CASH");

  // Timers
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeShopElapsedSeconds, setActiveShopElapsedSeconds] = useState(0);

  // Active visit at shop (checkOutTime is null)
  const activeVisit: ShiftVisit | null =
    shift?.status === "ACTIVE" && shift.visits && shift.visits.length > 0
      ? shift.visits.find((v) => !v.checkOutTime) ?? null
      : null;

  // Fetch current shift
  const fetchCurrentShift = async () => {
    try {
      setError(null);
      const res = await sellerApi.getCurrentShift();
      const current = res.shift ?? null;
      setShift(current);
      cachedActiveShift = current;
      hasLoadedShiftOnce = true;
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

  // Timer effect for active shop visit
  useEffect(() => {
    if (!activeVisit) {
      setActiveShopElapsedSeconds(0);
      return;
    }
    const checkInMs = new Date(activeVisit.checkInTime).getTime();
    const updateShopTimer = () => {
      const now = Date.now();
      setActiveShopElapsedSeconds(Math.max(0, Math.floor((now - checkInMs) / 1000)));
    };
    updateShopTimer();
    const interval = setInterval(updateShopTimer, 1000);
    return () => clearInterval(interval);
  }, [activeVisit]);

  // Load customers for check-in picker
  const loadCustomers = async () => {
    try {
      const res = await sellerApi.listCustomers({ pageSize: 50 });
      setCustomers(res.customers ?? res.items ?? []);
    } catch {
      // Ignored
    }
  };

  const handleStartShift = async (faceResult?: FaceVerificationResult) => {
    setIsSubmitting(true);
    setError(null);
    setActionSuccess(null);
    try {
      const coords = await getCurrentCoordinates();
      const res = await sellerApi.startShift({
        latitude: coords.latitude,
        longitude: coords.longitude,
        faceVerified: faceResult?.faceVerified ?? true,
        facePhoto: faceResult?.facePhoto,
        faceConfidence: faceResult?.faceConfidence ?? 0.98,
        faceMethod: faceResult?.faceMethod ?? "FACE_ID_BIOMETRIC",
      });
      setShift(res.shift);
      setActionSuccess("Shift started via Face ID! Identity verified & location captured.");
      webNotificationService.addNotification({
        recipientRole: "SELLER",
        title: "Field Shift Started (Face ID Verified)",
        message: `Duty shift active for ${user?.name || "Field Officer"}. Face ID verified and timer running.`,
        category: "SHIFTS",
        kind: "SHIFT_STARTED",
        link: "/seller/shifts",
      });
      if (onShiftChange) onShiftChange(res.shift);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start shift.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setFaceModalMode(null);
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
      setActionSuccess(`Check-in recorded at ${shop}! Timer started.`);
      webNotificationService.addNotification({
        recipientRole: "SELLER",
        title: "Shop Check-in Recorded",
        message: `Checked in at "${shop}". Store visit timer running.`,
        category: "SHIFTS",
        kind: "VISIT_CHECKIN",
        link: "/seller/shifts",
        metadata: { shopName: shop },
      });
      await fetchCurrentShift();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record check-in.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCheckOut = async () => {
    setCheckOutNotes("");
    setCheckOutFeedback("");
    setCheckOutSaleDone(false);
    setSaleQuantity(1);
    setSalePaymentMode("CASH");
    setError(null);
    if (activeVisit) {
      setCheckOutCustomerId(activeVisit.customerId || "");
    }
    setShowCheckOutModal(true);

    try {
      const [custRes, prodRes, invRes] = await Promise.all([
        customers.length === 0 ? sellerApi.listCustomers({ pageSize: 100 }).catch(() => ({ customers: [] })) : Promise.resolve({ customers }),
        products.length === 0 ? sellerApi.listProducts().catch(() => ({ items: [] })) : Promise.resolve({ items: products }),
        sellerApi.getInventory().catch(() => null),
      ]);
      if (custRes?.customers && custRes.customers.length > 0) {
        setCustomers(custRes.customers);
        if (!activeVisit?.customerId && !checkOutCustomerId) {
          const matched = custRes.customers.find(
            (c) => c.shopName.toLowerCase() === activeVisit?.shopName.toLowerCase()
          );
          if (matched) setCheckOutCustomerId(matched.id);
          else setCheckOutCustomerId(custRes.customers[0].id);
        }
      }
      if (prodRes?.items && prodRes.items.length > 0) {
        setProducts(prodRes.items);
        const initialProd = prodRes.items[0];
        setSelectedProductId((prev) => prev || initialProd.id);
        setSaleUnitPrice((prev) => (prev ? prev : (initialProd.basePricePaise / 100)));
      }
      if (invRes?.products) {
        setProductStocks(invRes.products.map((p) => ({ productId: p.productId, balance: p.balance })));
      }
    } catch (err) {
      console.warn("Could not prefetch checkout context:", err);
    }
  };

  const handleConfirmCheckOut = async () => {
    if (!activeVisit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const coords = await getCurrentCoordinates();
      let generatedSaleId: string | undefined = undefined;

      if (checkOutSaleDone) {
        const targetCustomerId = checkOutCustomerId || activeVisit.customerId;
        if (!targetCustomerId) {
          setError("Please select a customer account to record this sale invoice.");
          setIsSubmitting(false);
          return;
        }
        if (!saleQuantity || saleQuantity <= 0) {
          setError("Please enter a valid packet quantity greater than 0.");
          setIsSubmitting(false);
          return;
        }

        const chosenProduct = products.find((p) => p.id === selectedProductId) || products[0];
        const prodId = chosenProduct?.id || "";
        const unitPricePaise = Math.round((saleUnitPrice || 25) * 100);
        const reqKey = "sale_checkout_" + activeVisit.id + "_" + Date.now();

        const saleRes = await sellerApi.createSale({
          customerId: targetCustomerId,
          items: prodId
            ? [{ productId: prodId, quantity: saleQuantity, unitPricePaise }]
            : undefined,
          quantity: saleQuantity,
          unitPricePaise,
          paymentMode: salePaymentMode,
          requestKey: reqKey,
          customerFeedback: checkOutFeedback.trim() || undefined,
        } as any);

        const createdSale = (saleRes as any)?.sale || (saleRes as any)?.item || saleRes;
        generatedSaleId = createdSale?.id;

        webNotificationService.addNotification({
          recipientRole: "SELLER",
          title: "Sale Recorded on Shop Checkout",
          message: "Sale of " + saleQuantity + " packets (₹" + (saleQuantity * (saleUnitPrice || 25)).toLocaleString("en-IN") + ") recorded for \"" + activeVisit.shopName + "\".",
          category: "SALES",
          kind: "SALE_SUBMITTED",
          link: "/seller/sales",
          metadata: {
            shopName: activeVisit.shopName,
            quantity: saleQuantity,
            total: saleQuantity * (saleUnitPrice || 25),
            paymentMode: salePaymentMode,
          },
        });
      }

      const res = await sellerApi.checkOut({
        visitId: activeVisit.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        saleDone: checkOutSaleDone,
        saleId: generatedSaleId,
        customerFeedback: checkOutFeedback.trim() || undefined,
        notes: checkOutNotes.trim() || undefined,
      });

      setShowCheckOutModal(false);
      const visitData = res.data?.visit || res.visit;
      const durationDisplay = visitData?.durationMins != null
        ? visitData.durationMins.toFixed(1) + " mins"
        : formatDuration(activeShopElapsedSeconds);

      const successMsg = checkOutSaleDone
        ? "Checked out from " + activeVisit.shopName + "! Sale recorded & feedback saved. Time spent: " + durationDisplay
        : "Checked out from " + activeVisit.shopName + "! Outcome logged. Time spent: " + durationDisplay;

      setActionSuccess(successMsg);
      webNotificationService.addNotification({
        recipientRole: "SELLER",
        title: "Shop Check-out Completed",
        message: successMsg,
        category: "SHIFTS",
        kind: "VISIT_CHECKOUT",
        link: "/seller/shifts",
        metadata: { shopName: activeVisit.shopName, duration: durationDisplay, saleDone: checkOutSaleDone },
      });

      await fetchCurrentShift();
      setTimeout(() => setActionSuccess(null), 4500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to check out.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEndShift = async (faceResult?: FaceVerificationResult) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const coords = await getCurrentCoordinates();
      const res = await sellerApi.endShift({
        latitude: coords.latitude,
        longitude: coords.longitude,
        faceVerified: faceResult?.faceVerified ?? true,
        facePhoto: faceResult?.facePhoto,
        faceConfidence: faceResult?.faceConfidence ?? 0.98,
        faceMethod: faceResult?.faceMethod ?? "FACE_ID_BIOMETRIC",
      });
      setShowEndModal(false);
      setFaceModalMode(null);
      setShift(null);
      if (onShiftChange) onShiftChange(null);
      setActionSuccess(`Shift ended via Face ID! Total route distance: ${res.shift.totalDistanceKm} km.`);
      webNotificationService.addNotification({
        recipientRole: "SELLER",
        title: "Field Shift Ended (Face ID Verified)",
        message: `Duty shift completed for ${user?.name || "Field Officer"} with verified Face ID. Total route: ${res.shift.totalDistanceKm || 0} km.`,
        category: "SHIFTS",
        kind: "SHIFT_ENDED",
        link: "/seller/shifts",
        metadata: { totalDistanceKm: res.shift.totalDistanceKm },
      });
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
  const recentVisits = shift?.visits ? [...shift.visits].reverse() : [];

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
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-950">Duty Shift Active</h3>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      On Field
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <ScanFace className="h-3 w-3 text-emerald-600" />
                      Face ID Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Started at {new Date(shift.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Running Shift Timer */}
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 self-start sm:self-auto shadow-2xs">
                <Clock className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span className="font-mono text-xs font-bold text-zinc-800">{formatDuration(elapsedSeconds)}</span>
              </div>
            </div>

            {/* CURRENT ACTIVE SHOP VISIT CARD */}
            {activeVisit ? (
              <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 p-4 shadow-sm animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                      <Store className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 rounded-full px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                          Currently at Shop
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Since {new Date(activeVisit.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-zinc-950 mt-1">{activeVisit.shopName}</h4>
                      {activeVisit.notes && (
                        <p className="text-xs text-zinc-600 mt-0.5 italic">&ldquo;{activeVisit.notes}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  {/* Shop Live Timer & Check-out action */}
                  <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    <div className="flex items-center gap-1.5 rounded-xl bg-white border border-emerald-200 px-3 py-2 shadow-2xs">
                      <Timer className="h-4 w-4 text-emerald-600 animate-spin" style={{ animationDuration: "3s" }} />
                      <div className="text-left">
                        <span className="block text-[9px] uppercase font-bold text-zinc-600 tracking-wider">Time at Shop</span>
                        <span className="font-mono text-sm font-black text-emerald-700">{formatDuration(activeShopElapsedSeconds)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenCheckOut}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Check Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

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

            {/* VISITS LIST WITH CHECK-OUT STATUS / DURATION */}
            {shift.visits && shift.visits.length > 0 && (
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Today's Shop Visits ({shift.visits.length})
                  </span>
                  <span className="text-[10px] text-zinc-500">Latest first</span>
                </div>
                <div className="space-y-2">
                  {recentVisits.map((v) => {
                    const isCurrent = !v.checkOutTime;
                    return (
                      <div
                        key={v.id}
                        className={`flex items-center justify-between rounded-lg p-2.5 text-xs transition ${
                          isCurrent
                            ? "bg-emerald-50/80 border border-emerald-200"
                            : "bg-white border border-zinc-200/70"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-bold text-[10px] ${
                              isCurrent
                                ? "bg-emerald-500 text-white"
                                : "bg-rose-50 text-[#E61C5D]"
                            }`}
                          >
                            <Store className="h-3 w-3" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-zinc-900 truncate block">{v.shopName}</span>
                            <span className="text-[10px] text-zinc-500">
                              Arrived: {new Date(v.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              {v.checkOutTime && (
                                <> &middot; Left: {new Date(v.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</>
                              )}
                            </span>
                            {v.checkOutTime && (
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {v.saleDone || v.saleId || v.sale ? (
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-bold">
                                    <ShoppingBag className="h-2.5 w-2.5 text-emerald-600" />
                                    Sale: ₹{((v.sale?.totalPaise ?? 0) / 100).toLocaleString("en-IN") || "Done"}
                                    {v.sale?.quantity ? " (" + v.sale.quantity + " pkts)" : ""}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded bg-zinc-100 text-zinc-600 px-1.5 py-0.2 text-[9px] font-medium">
                                    No Sale
                                  </span>
                                )}
                                {v.customerFeedback && (
                                  <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-1.5 py-0.2 text-[9px] font-medium truncate max-w-[180px]" title={v.customerFeedback}>
                                    <MessageSquare className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                                    &ldquo;{v.customerFeedback}&rdquo;
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          {isCurrent ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                                {formatDuration(activeShopElapsedSeconds)}
                              </span>
                              <button
                                type="button"
                                onClick={handleOpenCheckOut}
                                className="rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                              >
                                Check Out
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
                              <Clock className="h-3 w-3 text-zinc-400" />
                              {v.durationMins != null ? formatMinutes(v.durationMins) : "Logged"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {activeVisit ? (
                <button
                  type="button"
                  onClick={handleOpenCheckOut}
                  disabled={isSubmitting}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Check Out from {activeVisit.shopName}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCheckIn}
                  disabled={isSubmitting}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(230,28,93,0.2)] hover:bg-[#cf1550] transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Check In at Shop</span>
                </button>
              )}

              {activeVisit && (
                <button
                  type="button"
                  onClick={handleOpenCheckIn}
                  disabled={isSubmitting}
                  title="Check in at next shop (auto checks out current shop)"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                  <span>New Check-In</span>
                </button>
              )}

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
                  Punch in your shift to log visits, track customer check-ins, record shop timing, and calculate your daily travel kilometres.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setFaceModalMode("START")}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#156035] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(21,96,53,0.2)] hover:bg-[#0f4626] transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Starting shift...</span>
                  </>
                ) : (
                  <>
                    <ScanFace className="h-4 w-4 text-emerald-300" />
                    <span>Start Day Shift (Face ID)</span>
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
                  <h3 className="text-base font-bold text-zinc-950">Record Shop Check-In</h3>
                  <p className="text-xs text-zinc-500">Log your arrival at this customer location</p>
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

      {/* CHECK-OUT MODAL */}
      {showCheckOutModal && activeVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <LogOut className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Shop Visit Check-Out</h3>
                  <p className="text-xs text-zinc-500 font-medium">{activeVisit.shopName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckOutModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Timing Summary */}
              <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/80 text-xs flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Arrived At</span>
                  <span className="font-bold text-zinc-800">
                    {new Date(activeVisit.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Time Spent</span>
                  <span className="font-bold font-mono text-emerald-700 text-sm">
                    {formatDuration(activeShopElapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* SALES QUESTION PROMPT */}
              <div className="rounded-2xl border-2 border-dashed border-rose-200/90 bg-rose-50/30 p-3.5 sm:p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <ShoppingBag className="h-4 w-4 text-[#E61C5D]" />
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-900">
                    Did you generate a sale at this shop?
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCheckOutSaleDone(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                      !checkOutSaleDone
                        ? "border-zinc-800 bg-zinc-900 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-xs font-bold">No Sale Done</span>
                    <span className={`text-[10px] mt-0.5 ${!checkOutSaleDone ? "text-zinc-300" : "text-zinc-500"}`}>
                      Follow-up / Inquiry only
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckOutSaleDone(true)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                      checkOutSaleDone
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/60"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Yes, Sale Completed!
                    </span>
                    <span className={`text-[10px] mt-0.5 ${checkOutSaleDone ? "text-emerald-100" : "text-emerald-700"}`}>
                      Book order &amp; record units
                    </span>
                  </button>
                </div>
              </div>

              {/* IF SALE DONE: SHOW SALE ENTRY FIELDS */}
              {checkOutSaleDone ? (
                <div className="space-y-3.5 rounded-2xl border border-emerald-200 bg-white p-3.5 sm:p-4 shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                      Sale Details &amp; Quantity
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Billing
                    </span>
                  </div>

                  {/* Customer Link Selector if visit has no customerId */}
                  {!activeVisit.customerId && (
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        Link Customer Account for Tax Invoice *
                      </label>
                      <select
                        value={checkOutCustomerId}
                        onChange={(e) => setCheckOutCustomerId(e.target.value)}
                        className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
                      >
                        <option value="">-- Choose customer from list --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.shopName} ({c.contactName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Product & Available Stock */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-700">Product</label>
                      {selectedProductId && (
                        <span className="text-[10px] font-semibold text-emerald-700">
                          In Stock: {productStocks.find((s) => s.productId === selectedProductId)?.balance ?? "Available"} pkts
                        </span>
                      )}
                    </div>
                    {products.length > 0 ? (
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          const p = products.find((prod) => prod.id === e.target.value);
                          if (p) setSaleUnitPrice(p.basePricePaise / 100);
                        }}
                        className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · Base ₹{p.basePricePaise / 100}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value="Femmeflo Sanitary Pads (Standard)"
                        className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs font-semibold text-zinc-600"
                      />
                    )}
                  </div>

                  {/* Quantity & Unit Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Quantity (Packets)</label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setSaleQuantity((q) => Math.max(1, q - 1))}
                          className="flex h-9 w-9 items-center justify-center rounded-l-xl border border-r-0 border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={saleQuantity}
                          onChange={(e) => setSaleQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-9 w-full border border-zinc-200 bg-white text-center text-xs font-bold text-zinc-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setSaleQuantity((q) => q + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-r-xl border border-l-0 border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Unit Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        value={saleUnitPrice}
                        onChange={(e) => setSaleUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-900 outline-none focus:border-rose-300"
                      />
                    </div>
                  </div>

                  {/* Total Amount Preview */}
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-200 p-2.5">
                    <span className="text-xs font-bold text-emerald-900">Total Sale Amount:</span>
                    <span className="text-base font-black text-emerald-700">
                      ₹{(saleQuantity * (saleUnitPrice || 0)).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Payment Mode Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">Payment Mode</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["CASH", "BANK", "PENDING"] as PaymentMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSalePaymentMode(mode)}
                          className={`rounded-lg py-1.5 text-center text-xs font-bold transition cursor-pointer border ${
                            salePaymentMode === mode
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          {mode === "CASH" ? "Cash" : mode === "BANK" ? "UPI / Bank" : "Pending"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* CUSTOMER FEEDBACK (OPTIONAL) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#E61C5D]" />
                    <span>Customer Feedback / Visit Reason</span>
                    <span className="text-[10px] text-zinc-400 font-normal">(Optional)</span>
                  </label>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(checkOutSaleDone
                    ? [
                        "Repeat order client",
                        "Cash paid instantly",
                        "High product demand",
                        "Satisfied with quality",
                      ]
                    : [
                        "Stock already sufficient",
                        "Price resistance / negotiation",
                        "Decision maker unavailable",
                        "Order planned for next visit",
                        "Sample provided for trial",
                        "Previous payment pending",
                      ]
                  ).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCheckOutFeedback(chip)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition cursor-pointer ${
                        checkOutFeedback === chip
                          ? "bg-rose-50 border-[#E61C5D] text-[#E61C5D]"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={checkOutFeedback}
                  onChange={(e) => setCheckOutFeedback(e.target.value)}
                  placeholder={
                    checkOutSaleDone
                      ? "Optional customer remarks (e.g. Shopkeeper liked packaging, requested weekly re-stock)..."
                      : "Optional visit feedback (e.g. Will place order on Saturday once owner returns)..."
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-800 outline-none focus:border-rose-300 resize-none"
                />
              </div>

              {/* Departure Notes (Optional) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Departure Notes (Optional)</label>
                <input
                  type="text"
                  value={checkOutNotes}
                  onChange={(e) => setCheckOutNotes(e.target.value)}
                  placeholder="e.g. Shop visit concluded smoothly"
                  className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>

              {/* GPS Info */}
              <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-200/80 text-[11px] text-zinc-500 flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Exit GPS location will be captured to finalize your shop duration and route.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCheckOutModal(false)}
                  className="h-9 rounded-xl px-3.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmCheckOut}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition cursor-pointer ${
                    checkOutSaleDone
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                      : "bg-zinc-900 hover:bg-zinc-800"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : checkOutSaleDone ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Record Sale &amp; Check Out</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Confirm Check-Out (No Sale)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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
                  <p className="text-xs text-zinc-500">Finalize duties, shop timings and calculate total travel KM</p>
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
                {activeVisit && (
                  <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800 border border-amber-200">
                    <strong>Note:</strong> You are still checked in at <em>{activeVisit.shopName}</em>. Ending the shift will automatically check you out now.
                  </div>
                )}
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
                  onClick={() => {
                    setShowEndModal(false);
                    setFaceModalMode("END");
                  }}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Ending shift...</span>
                    </>
                  ) : (
                    <>
                      <ScanFace className="h-4 w-4" />
                      <span>Verify Face ID &amp; End Shift</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLE FACE ID BIOMETRIC VERIFICATION MODAL */}
      <FaceVerificationModal
        isOpen={faceModalMode !== null}
        mode={faceModalMode || "START"}
        userName={user?.name || "Field Officer"}
        userRole={user?.role || "Seller"}
        onClose={() => setFaceModalMode(null)}
        onVerified={(faceResult) => {
          if (faceModalMode === "START") {
            handleStartShift(faceResult);
          } else if (faceModalMode === "END") {
            handleConfirmEndShift(faceResult);
          }
        }}
      />
    </>
  );
}
