"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
  Info,
  Layers,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  TrendingUp,
  Truck,
  Users,
  X,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { clearApiCache } from "@/lib/api/client";
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboardData, DashboardFilterOptions } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

// In-memory cache for admin overview to prevent reloading flashes on section changes
let cachedAdminDashboard: AdminDashboardData | null = null;
let cachedFilterOptions: DashboardFilterOptions | null = null;

export default function AdminOverviewDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(cachedAdminDashboard);
  const [loading, setLoading] = useState(!cachedAdminDashboard);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter options loaded from backend
  const [filterOptions, setFilterOptions] = useState<DashboardFilterOptions | null>(cachedFilterOptions);

  // Selected filters
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Fetch filter options on mount
  useEffect(() => {
    let active = true;
    async function loadFilters() {
      if (cachedFilterOptions) {
        setFilterOptions(cachedFilterOptions);
      }
      try {
        const res = await adminApi.getDashboardFilters();
        if (active && res) {
          cachedFilterOptions = res;
          setFilterOptions(res);
        }
      } catch (err) {
        console.warn("Failed to load dashboard filter options:", err);
      }
    }
    loadFilters();
    return () => {
      active = false;
    };
  }, []);

  const fetchDashboard = useCallback(async (isManual = false) => {
    if (isManual || !cachedAdminDashboard) {
      if (cachedAdminDashboard) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
    }
    try {
      // Pass only geographic/hierarchy parameters to getDashboard (never from/to)
      const scopeFilters = {
        state: selectedState || undefined,
        district: selectedDistrict || undefined,
        village: selectedVillage || undefined,
        managerId: selectedManagerId || undefined,
        sellerId: selectedSellerId || undefined,
        categoryId: selectedCategoryId || undefined,
      };

      const [dashRes, salesRes] = await Promise.all([
        adminApi.getDashboard(scopeFilters).catch((err) => {
          console.warn("Dashboard overview API notice:", err?.message || err);
          return null;
        }),
        adminApi.getSalesReport({
          state: selectedState || undefined,
          district: selectedDistrict || undefined,
          village: selectedVillage || undefined,
          managerId: selectedManagerId || undefined,
          sellerId: selectedSellerId || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          status: "CONFIRMED",
        }).catch((err) => {
          console.warn("Sales report API notice:", err?.message || err);
          return null;
        }),
      ]);

      const isFiltered = Boolean(fromDate || toDate || selectedState || selectedDistrict || selectedVillage || selectedManagerId || selectedSellerId || selectedCategoryId);

      const netPaise = salesRes?.summary?.netSalesPaise || salesRes?.summary?.grossSalesPaise || 0;
      const netRupees = salesRes?.summary?.netSalesRupees || salesRes?.summary?.grossSalesRupees || (netPaise / 100);
      const packetsSold = salesRes?.summary?.totalQuantitySold || 0;

      const filteredIncentivePaise = salesRes?.items ? salesRes.items.reduce((acc, it) => acc + (it.incentiveAmountPaise || 0), 0) : 0;
      const filteredIncentiveRupees = filteredIncentivePaise > 0 ? filteredIncentivePaise / 100 : (packetsSold * 5);

      const baseMetrics = dashRes?.metrics ?? {
        totalPacketsSold: 0,
        totalEarningsPaise: 0,
        totalEarningsRupees: 0,
        totalStates: 0,
        totalShops: 0,
        totalManagers: 0,
        totalSellers: 0,
        totalInventory: 0,
        hqStock: 0,
        warehouseStock: 0,
        sellerStock: 0,
        totalIncentivePaise: 0,
        totalIncentiveRupees: 0,
      };

      if (isFiltered) {
        setData({
          metrics: {
            ...baseMetrics,
            totalEarningsPaise: netPaise,
            totalEarningsRupees: netRupees,
            totalPacketsSold: packetsSold,
            totalIncentivePaise: filteredIncentivePaise,
            totalIncentiveRupees: filteredIncentiveRupees,
          },
          appliedFilters: {
            state: selectedState || undefined,
            district: selectedDistrict || undefined,
            village: selectedVillage || undefined,
            managerId: selectedManagerId || undefined,
            sellerId: selectedSellerId || undefined,
            categoryId: selectedCategoryId || undefined,
          },
        });
      } else {
        if (dashRes) {
          setData(dashRes);
          cachedAdminDashboard = dashRes;
        } else {
          const fb = {
            metrics: baseMetrics,
            appliedFilters: {},
          };
          setData(fb);
          cachedAdminDashboard = fb;
        }
      }
    } catch (err: unknown) {
      console.warn("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedState, selectedDistrict, selectedVillage, selectedManagerId, selectedSellerId, selectedCategoryId, fromDate, toDate]);

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
  const monthStartStr = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  const activeDatePreset = useMemo(() => {
    if (!fromDate || !toDate) return null;
    if (fromDate === todayStr && toDate === todayStr) return "today";
    if (fromDate === sevenDaysAgoStr && toDate === todayStr) return "7days";
    if (fromDate === thirtyDaysAgoStr && toDate === todayStr) return "30days";
    if (fromDate === monthStartStr && toDate === todayStr) return "month";
    return "custom";
  }, [fromDate, toDate, todayStr, sevenDaysAgoStr, thirtyDaysAgoStr, monthStartStr]);

  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchDashboard();
    }, 300);
    return () => clearTimeout(fetchTimeoutRef.current);
  }, [fetchDashboard]);

  // 1. Available States
  const availableStates = useMemo(() => {
    return filterOptions?.states ?? [];
  }, [filterOptions]);

  // 2. Cascaded Districts (filtered by selected state)
  const availableDistricts = useMemo(() => {
    if (!filterOptions) return [];
    if (selectedState) {
      return (filterOptions.districts ?? [])
        .filter((d) => (typeof d === "object" ? d.state.toLowerCase() === selectedState.toLowerCase() : true))
        .map((d) => (typeof d === "object" ? d.district : d));
    }
    const set = new Set<string>();
    for (const d of filterOptions.districts ?? []) {
      set.add(typeof d === "object" ? d.district : d);
    }
    return Array.from(set).sort();
  }, [filterOptions, selectedState]);

  // 3. Cascaded Villages (filtered by selected state and district)
  const availableVillages = useMemo(() => {
    if (!filterOptions?.villages) return [];
    const set = new Set<string>();
    for (const v of filterOptions.villages) {
      if (typeof v === "string") {
        set.add(v);
      } else {
        const matchesState = !selectedState || v.state.toLowerCase() === selectedState.toLowerCase();
        const matchesDistrict = !selectedDistrict || v.district.toLowerCase() === selectedDistrict.toLowerCase();
        if (matchesState && matchesDistrict && v.village) {
          set.add(v.village);
        }
      }
    }
    return Array.from(set).sort();
  }, [filterOptions, selectedState, selectedDistrict]);

  // 4. Cascaded Managers (filtered by state/district)
  const availableManagers = useMemo(() => {
    if (!filterOptions?.managers) return [];
    return filterOptions.managers.filter((m) => {
      const matchesState = !selectedState || !m.state || m.state.toLowerCase() === selectedState.toLowerCase();
      const matchesDistrict = !selectedDistrict || !m.district || m.district.toLowerCase() === selectedDistrict.toLowerCase();
      return matchesState && matchesDistrict;
    });
  }, [filterOptions, selectedState, selectedDistrict]);

  // 5. Cascaded Sellers (filtered by manager, state, or district)
  const availableSellers = useMemo(() => {
    if (!filterOptions?.sellers) return [];
    return filterOptions.sellers.filter((s) => {
      const matchesManager = !selectedManagerId || s.managerId === selectedManagerId;
      const matchesState = !selectedState || !s.state || s.state.toLowerCase() === selectedState.toLowerCase();
      const matchesDistrict = !selectedDistrict || !s.district || s.district.toLowerCase() === selectedDistrict.toLowerCase();
      return matchesManager && matchesState && matchesDistrict;
    });
  }, [filterOptions, selectedManagerId, selectedState, selectedDistrict]);

  // 6. Categories
  const availableCategories = useMemo(() => {
    return filterOptions?.categories ?? [];
  }, [filterOptions]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict("");
    setSelectedVillage("");
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedVillage("");
  };

  const handleClearFilters = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedVillage("");
    setSelectedManagerId("");
    setSelectedSellerId("");
    setSelectedCategoryId("");
    setFromDate("");
    setToDate("");
  };

  const activeFilterCount = [
    selectedState,
    selectedDistrict,
    selectedVillage,
    selectedManagerId,
    selectedSellerId,
    selectedCategoryId,
    fromDate,
    toDate,
  ].filter(Boolean).length;

  const metrics = data?.metrics ?? {
    totalPacketsSold: 0,
    totalEarningsPaise: 0,
    totalEarningsRupees: 0,
    totalStates: 0,
    totalShops: 0,
    totalManagers: 0,
    totalSellers: 0,
    totalInventory: 0,
    hqStock: 0,
    warehouseStock: 0,
    sellerStock: 0,
    totalIncentivePaise: 0,
    totalIncentiveRupees: 0,
  };
  const { user } = useAuth();

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName={user?.name ?? "Super Admin"}
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Operations command"
        title="Admin overview"
        description="Live operational metrics across HQ inventory, regional warehouses, assigned managers, active sellers, and field retail coverage."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                clearApiCache();
                cachedAdminDashboard = null;
                fetchDashboard(true);
              }}
              disabled={loading || isRefreshing}
              title="Refresh dashboard metrics"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50 shadow-xs active:scale-95 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className={`inline-flex h-10 sm:h-11 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer ${
                filtersExpanded || activeFilterCount > 0
                  ? "border-[#E61C5D] bg-rose-50 text-[#E61C5D]"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-rose-200 hover:text-[#E61C5D]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#E61C5D]" />
              <span>{filtersExpanded ? "Hide filters" : "Filter"}</span>
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-[#E61C5D] px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : (
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                  All India
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${filtersExpanded ? "rotate-180" : ""}`} />
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex h-10 sm:h-11 items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-bold text-zinc-700 hover:border-rose-200 hover:text-[#E61C5D] hover:bg-rose-50 transition active:scale-95 shadow-xs cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="h-3 w-3 text-zinc-500" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        }
      />



      {/* Geographic & Hierarchy Filters Drawer */}
      {filtersExpanded && (
        <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-[#E61C5D]">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-zinc-900">Territory &amp; Scope Filters</h3>
                <p className="text-[11px] text-zinc-500">Filter live operational metrics by geographic hierarchy and category</p>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-bold text-zinc-700 hover:text-[#E61C5D] hover:border-rose-200 transition"
              >
                <RotateCcw className="h-3 w-3 text-zinc-500" />
                Reset all
              </button>
            )}
          </div>

          {/* Quick Date Presets & Date Range Bar */}
          <div className="mt-3.5 rounded-xl bg-[#FFF8FA] p-3 border border-rose-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1 mr-1">
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
                    ? "bg-[#E61C5D] text-white shadow-xs font-bold"
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
                    ? "bg-[#E61C5D] text-white shadow-xs font-bold"
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
                    ? "bg-[#E61C5D] text-white shadow-xs font-bold"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromDate(monthStartStr);
                  setToDate(todayStr);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  activeDatePreset === "month"
                    ? "bg-[#E61C5D] text-white shadow-xs font-bold"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:border-rose-200 hover:text-[#E61C5D]"
                }`}
              >
                This Month
              </button>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setFromDate(""); setToDate(""); }}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 hover:text-rose-600 underline cursor-pointer"
                >
                  Clear dates
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-zinc-600">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-zinc-600">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-semibold text-zinc-800 outline-none focus:border-rose-300"
                />
              </div>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* 1. State */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none transition focus:border-rose-300 focus:bg-white ${
                  selectedState
                    ? "border-[#E61C5D] bg-rose-50/40 text-[#E61C5D] font-bold shadow-xs"
                    : "border-zinc-200 bg-[#FAF8F5] text-zinc-800"
                }`}
                aria-label="Filter by state"
              >
                <option value="">All states</option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. District */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none transition focus:border-rose-300 focus:bg-white ${
                  selectedDistrict
                    ? "border-[#E61C5D] bg-rose-50/40 text-[#E61C5D] font-bold shadow-xs"
                    : "border-zinc-200 bg-[#FAF8F5] text-zinc-800"
                }`}
                aria-label="Filter by district"
              >
                <option value="">All districts</option>
                {availableDistricts.map((dst) => (
                  <option key={dst} value={dst}>
                    {dst}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Village / Area */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                Village / Area
              </label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none transition focus:border-rose-300 focus:bg-white ${
                  selectedVillage
                    ? "border-[#E61C5D] bg-rose-50/40 text-[#E61C5D] font-bold shadow-xs"
                    : "border-zinc-200 bg-[#FAF8F5] text-zinc-800"
                }`}
                aria-label="Filter by village"
              >
                <option value="">All villages</option>
                {availableVillages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Manager */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                Manager
              </label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none transition focus:border-rose-300 focus:bg-white ${
                  selectedManagerId
                    ? "border-[#E61C5D] bg-rose-50/40 text-[#E61C5D] font-bold shadow-xs"
                    : "border-zinc-200 bg-[#FAF8F5] text-zinc-800"
                }`}
                aria-label="Filter by manager"
              >
                <option value="">All managers</option>
                {availableManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Field Officer */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                Field Officer
              </label>
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none transition focus:border-rose-300 focus:bg-white ${
                  selectedSellerId
                    ? "border-[#E61C5D] bg-rose-50/40 text-[#E61C5D] font-bold shadow-xs"
                    : "border-zinc-200 bg-[#FAF8F5] text-zinc-800"
                }`}
                aria-label="Filter by seller"
              >
                <option value="">All field officers</option>
                {availableSellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Product Category */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none transition focus:border-rose-300 focus:bg-white ${
                  selectedCategoryId
                    ? "border-[#E61C5D] bg-rose-50/40 text-[#E61C5D] font-bold shadow-xs"
                    : "border-zinc-200 bg-[#FAF8F5] text-zinc-800"
                }`}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/30 p-2.5 px-3.5">
          <span className="text-[11px] font-bold text-zinc-700">Filtering by:</span>
          {selectedState && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D] shadow-xs">
              State: {selectedState}
              <button type="button" onClick={() => handleStateChange("")} aria-label="Remove state filter" className="cursor-pointer">
                <X className="h-3 w-3 hover:text-black" />
              </button>
            </span>
          )}
          {selectedDistrict && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D] shadow-xs">
              District: {selectedDistrict}
              <button type="button" onClick={() => handleDistrictChange("")} aria-label="Remove district filter" className="cursor-pointer">
                <X className="h-3 w-3 hover:text-black" />
              </button>
            </span>
          )}
          {selectedVillage && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D] shadow-xs">
              Village: {selectedVillage}
              <button type="button" onClick={() => setSelectedVillage("")} aria-label="Remove village filter" className="cursor-pointer">
                <X className="h-3 w-3 hover:text-black" />
              </button>
            </span>
          )}
          {selectedManagerId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D] shadow-xs">
              Manager: {availableManagers.find((m) => m.id === selectedManagerId)?.name || "Selected"}
              <button type="button" onClick={() => setSelectedManagerId("")} aria-label="Remove manager filter" className="cursor-pointer">
                <X className="h-3 w-3 hover:text-black" />
              </button>
            </span>
          )}
          {selectedSellerId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D] shadow-xs">
              Officer: {availableSellers.find((s) => s.id === selectedSellerId)?.name || "Selected"}
              <button type="button" onClick={() => setSelectedSellerId("")} aria-label="Remove seller filter" className="cursor-pointer">
                <X className="h-3 w-3 hover:text-black" />
              </button>
            </span>
          )}
          {selectedCategoryId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D] shadow-xs">
              Category: {availableCategories.find((c) => c.id === selectedCategoryId)?.name || "Selected"}
              <button type="button" onClick={() => setSelectedCategoryId("")} aria-label="Remove category filter" className="cursor-pointer">
                <X className="h-3 w-3 hover:text-black" />
              </button>
            </span>
          )}
          {(fromDate || toDate) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D] shadow-xs">
              Date: {fromDate || "Earliest"} to {toDate || "Latest"}
              <button type="button" onClick={() => { setFromDate(""); setToDate(""); }} aria-label="Remove date filter" className="cursor-pointer">
                <X className="h-3 w-3 hover:text-black" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[11px] font-bold text-zinc-600 hover:text-[#E61C5D] underline ml-auto cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* No sales data in filtered range helper */}
      {activeFilterCount > 0 && metrics.totalPacketsSold === 0 && !loading && (
        <div className="mt-5 rounded-2xl border border-rose-100 bg-[#FFF9FA] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-rose-200 text-[#E61C5D] shadow-xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
                No confirmed sales for selected period &amp; filters
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-600 leading-relaxed">
                {fromDate || toDate
                  ? `Zero transactions recorded between ${fromDate || "earliest"} and ${toDate || "today"}. Revenue and packets sold show 0.`
                  : "No sales match your current territory filters. Stock balances below reflect live inventory."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:border-rose-200 hover:text-[#E61C5D] transition active:scale-95 shadow-xs cursor-pointer"
              >
                Clear Dates
              </button>
            )}
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg bg-[#E61C5D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#cf1550] transition active:scale-95 shadow-xs cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={`₹${metrics.totalEarningsRupees.toLocaleString("en-IN")}`}
          note={
            metrics.totalPacketsSold === 0
              ? activeFilterCount > 0
                ? "0 sales in selected filter / period"
                : "No confirmed sales recorded yet"
              : "Confirmed sales across network"
          }
          icon="rupee"
          tone="green"
          href="/admin/sales"
        />
        <MetricCard
          label="Packets Sold"
          value={metrics.totalPacketsSold.toLocaleString("en-IN")}
          note={
            metrics.totalPacketsSold === 0
              ? activeFilterCount > 0
                ? "0 packets in selected filter / period"
                : "No field distribution recorded yet"
              : "Confirmed field distribution"
          }
          icon="packages"
          tone="rose"
          href="/admin/sales"
        />
        <MetricCard
          label="Total Inventory"
          value={metrics.totalInventory.toLocaleString("en-IN")}
          note="HQ, warehouses & field team"
          icon="package"
          tone="amber"
          href="/admin/inventory"
        />
        <MetricCard
          label="Active Field Officers"
          value={metrics.totalSellers.toString()}
          note={`Supervised by ${metrics.totalManagers} managers`}
          icon="chart"
          tone="green"
          href="/admin/sellers"
        />
      </div>

      {/* Stock Distribution by Level */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Where is your stock?"
          description="See how many packets are at HQ, in regional warehouses, and with field officers"
          className="lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/admin/inventory?tab=hq"
              className="group block rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-rose-300 hover:shadow-[0_12px_32px_rgba(104,48,66,0.08)] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-[#E61C5D] shadow-sm group-hover:scale-105 transition-transform">
                  <Layers className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 group-hover:text-[#E61C5D] transition-colors">
                  HQ Central &rarr;
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold font-sans tracking-tight text-zinc-900 group-hover:text-[#E61C5D] transition-colors">
                {metrics.hqStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-800">Packets in central warehouse</p>
            </Link>

            <Link
              href="/admin/inventory?tab=warehouses"
              className="group block rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_12px_32px_rgba(104,48,66,0.08)] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-amber-600 shadow-sm group-hover:scale-105 transition-transform">
                  <Package className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 group-hover:text-amber-700 transition-colors">
                  Regional Depots &rarr;
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold font-sans tracking-tight text-zinc-900 group-hover:text-amber-700 transition-colors">
                {metrics.warehouseStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-800">Packets in district storage</p>
            </Link>

            <Link
              href="/admin/inventory?tab=sellers"
              className="group block rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_12px_32px_rgba(104,48,66,0.08)] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-[#156035] shadow-sm group-hover:scale-105 transition-transform">
                  <PackageCheck className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 group-hover:text-[#156035] transition-colors">
                  With Officers &rarr;
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold font-sans tracking-tight text-zinc-900 group-hover:text-[#156035] transition-colors">
                {metrics.sellerStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-800">Packets with officers ready to sell</p>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t border-zinc-100 pt-5">
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-[#E61C5D] hover:underline"
            >
              View full stock details & history &rarr;
            </Link>
            <span className="text-zinc-300">·</span>
            <Link
              href="/admin/inventory/transfers"
              className="text-xs font-bold text-[#156035] hover:underline"
            >
              Move packets between warehouses &rarr;
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Stores & Team Overview"
          description="Total shops connected, active officers, and commission paid"
        >
          <div className="space-y-4">
            <Link
              href="/admin/customers"
              className="group flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-emerald-50 p-2.5 text-[#156035] group-hover:scale-105 transition-transform">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800 group-hover:text-[#156035] transition-colors">Retailers / Shops</p>
                  <p className="text-xs text-zinc-700">Total verified retail shop partners</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-sans tracking-tight text-[#156035]">
                  {metrics.totalShops}
                </span>
                <span className="text-xs font-bold text-[#156035] opacity-0 group-hover:opacity-100 transition-opacity">
                  &rarr;
                </span>
              </div>
            </Link>

            <Link
              href="/admin/sellers"
              className="group flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50/40 hover:shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-rose-50 p-2.5 text-[#E61C5D] group-hover:scale-105 transition-transform">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800 group-hover:text-[#E61C5D] transition-colors">Field Officers</p>
                  <p className="text-xs text-zinc-700">Active team members in the field</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-sans tracking-tight text-[#E61C5D]">
                  {metrics.totalSellers}
                </span>
                <span className="text-xs font-bold text-[#E61C5D] opacity-0 group-hover:opacity-100 transition-opacity">
                  &rarr;
                </span>
              </div>
            </Link>

            <Link
              href="/admin/incentives"
              className="group flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700 group-hover:scale-105 transition-transform">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800 group-hover:text-amber-700 transition-colors">Incentives Earned</p>
                  <p className="text-xs text-zinc-700">Total commission earned on confirmed sales</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-sans tracking-tight text-amber-700">
                  ₹{metrics.totalIncentiveRupees.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  &rarr;
                </span>
              </div>
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Quick Action Navigation Grid */}
      <SectionCard
        title="Operations modules"
        description="Direct shortcuts to core business processes"
        className="mt-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Link
            href="/admin/approvals"
            className="group flex flex-col justify-between rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div>
              <span className="inline-flex rounded-xl bg-white p-2.5 text-[#E61C5D] shadow-sm group-hover:scale-105 transition-transform">
                <Clock3 className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-zinc-900">Approvals</h3>
              <p className="mt-1 text-xs text-zinc-800">Review low-price packet sales</p>
            </div>
            <span className="mt-4 text-xs font-bold text-[#E61C5D]">Open queue &rarr;</span>
          </Link>

          <Link
            href="/admin/sales"
            className="group flex flex-col justify-between rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div>
              <span className="inline-flex rounded-xl bg-white p-2.5 text-[#156035] shadow-sm group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-zinc-900">Sales ledger</h3>
              <p className="mt-1 text-xs text-zinc-800">Audit confirmed and pending transactions</p>
            </div>
            <span className="mt-4 text-xs font-bold text-[#156035]">View sales &rarr;</span>
          </Link>

          <Link
            href="/admin/invoices"
            className="group flex flex-col justify-between rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div>
              <span className="inline-flex rounded-xl bg-white p-2.5 text-zinc-700 shadow-sm group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-zinc-900">Invoices</h3>
              <p className="mt-1 text-xs text-zinc-800">Track delivery by Email & WhatsApp</p>
            </div>
            <span className="mt-4 text-xs font-bold text-zinc-700">Check invoices &rarr;</span>
          </Link>

          <Link
            href="/admin/reports"
            className="group flex flex-col justify-between rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div>
              <span className="inline-flex rounded-xl bg-white p-2.5 text-amber-700 shadow-sm group-hover:scale-105 transition-transform">
                <MapPin className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-zinc-900">Territory reports</h3>
              <p className="mt-1 text-xs text-zinc-800">Export CSV / JSON performance logs</p>
            </div>
            <span className="mt-4 text-xs font-bold text-amber-700">Explore reports &rarr;</span>
          </Link>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
