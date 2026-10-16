"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
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
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboardData, DashboardFilterOptions } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export default function AdminOverviewDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options loaded from backend
  const [filterOptions, setFilterOptions] = useState<DashboardFilterOptions | null>(null);

  // Selected filters
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Fetch filter options on mount
  useEffect(() => {
    let active = true;
    async function loadFilters() {
      try {
        const res = await adminApi.getDashboardFilters();
        if (active && res) {
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

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = {
        state: selectedState || undefined,
        district: selectedDistrict || undefined,
        village: selectedVillage || undefined,
        managerId: selectedManagerId || undefined,
        sellerId: selectedSellerId || undefined,
        categoryId: selectedCategoryId || undefined,
      };

      const res = await adminApi.getDashboard(activeFilters);
      setData(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Backend unavailable";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedVillage, selectedManagerId, selectedSellerId, selectedCategoryId]);

  useEffect(() => {
    fetchDashboard();
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
  };

  const activeFilterCount = [
    selectedState,
    selectedDistrict,
    selectedVillage,
    selectedManagerId,
    selectedSellerId,
    selectedCategoryId,
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
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              title="Refresh dashboard metrics"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <Link
              href="/admin/inventory/transfers"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550]"
            >
              <Truck className="h-4 w-4" /> Allocate stock
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <span>Unable to load live dashboard metrics. ({error})</span>
          <button onClick={() => fetchDashboard()} className="underline hover:text-amber-950 font-bold">
            Retry connection
          </button>
        </div>
      )}

      {/* Geographic & Hierarchy Filters Bar */}
      <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#E61C5D]">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">Territory & Scope Filters</h3>
                {activeFilterCount > 0 ? (
                  <span className="rounded-full bg-[#E61C5D] px-2 py-0.5 text-[10px] font-bold text-white">
                    {activeFilterCount} active
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
                    All India (National)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-700">
                Hierarchical drilldown: State &rarr; District &rarr; Village &rarr; Manager &rarr; Seller &rarr; Category
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:border-rose-200 hover:bg-rose-50 hover:text-[#E61C5D] transition cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 transition cursor-pointer"
            >
              {filtersExpanded ? "Collapse" : "Expand"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {filtersExpanded && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* 1. State */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-semibold text-zinc-700 outline-none focus:border-rose-300 focus:bg-white"
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
                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-semibold text-zinc-700 outline-none focus:border-rose-300 focus:bg-white"
                aria-label="Filter by district"
              >
                <option value="">All districts</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Village */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                Village / Town
              </label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-semibold text-zinc-700 outline-none focus:border-rose-300 focus:bg-white"
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
                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-semibold text-zinc-700 outline-none focus:border-rose-300 focus:bg-white"
                aria-label="Filter by manager"
              >
                <option value="">All managers</option>
                {availableManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.district ? `(${m.district})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Seller */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                Field Seller
              </label>
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-semibold text-zinc-700 outline-none focus:border-rose-300 focus:bg-white"
                aria-label="Filter by seller"
              >
                <option value="">All sellers</option>
                {availableSellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.district ? `(${s.district})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Category */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-xs font-semibold text-zinc-700 outline-none focus:border-rose-300 focus:bg-white"
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
        )}

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
            <span className="text-[11px] font-bold text-zinc-700">Filtering by:</span>
            {selectedState && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D]">
                State: {selectedState}
                <button type="button" onClick={() => handleStateChange("")} aria-label="Remove state filter" className="cursor-pointer">
                  <X className="h-3 w-3 hover:text-black" />
                </button>
              </span>
            )}
            {selectedDistrict && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D]">
                District: {selectedDistrict}
                <button type="button" onClick={() => handleDistrictChange("")} aria-label="Remove district filter" className="cursor-pointer">
                  <X className="h-3 w-3 hover:text-black" />
                </button>
              </span>
            )}
            {selectedVillage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D]">
                Village: {selectedVillage}
                <button type="button" onClick={() => setSelectedVillage("")} aria-label="Remove village filter" className="cursor-pointer">
                  <X className="h-3 w-3 hover:text-black" />
                </button>
              </span>
            )}
            {selectedManagerId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D]">
                Manager: {availableManagers.find((m) => m.id === selectedManagerId)?.name || "Selected"}
                <button type="button" onClick={() => setSelectedManagerId("")} aria-label="Remove manager filter" className="cursor-pointer">
                  <X className="h-3 w-3 hover:text-black" />
                </button>
              </span>
            )}
            {selectedSellerId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D]">
                Seller: {availableSellers.find((s) => s.id === selectedSellerId)?.name || "Selected"}
                <button type="button" onClick={() => setSelectedSellerId("")} aria-label="Remove seller filter" className="cursor-pointer">
                  <X className="h-3 w-3 hover:text-black" />
                </button>
              </span>
            )}
            {selectedCategoryId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#E61C5D]">
                Category: {availableCategories.find((c) => c.id === selectedCategoryId)?.name || "Selected"}
                <button type="button" onClick={() => setSelectedCategoryId("")} aria-label="Remove category filter" className="cursor-pointer">
                  <X className="h-3 w-3 hover:text-black" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={`₹${metrics.totalEarningsRupees.toLocaleString("en-IN")}`}
          note="Confirmed sales across network"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Packets Sold"
          value={metrics.totalPacketsSold.toLocaleString("en-IN")}
          note="Confirmed field distribution"
          icon="packages"
          tone="rose"
        />
        <MetricCard
          label="Total Inventory"
          value={metrics.totalInventory.toLocaleString("en-IN")}
          note="HQ, warehouses & sellers"
          icon="package"
          tone="amber"
        />
        <MetricCard
          label="Active Sellers"
          value={metrics.totalSellers.toString()}
          note={`Supervised by ${metrics.totalManagers} managers`}
          icon="chart"
          tone="green"
        />
      </div>

      {/* Stock Distribution by Level */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Stock by echelon"
          description="Physical inventory position from central to field"
          className="lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-[#E61C5D] shadow-sm">
                  <Layers className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">HQ Central</span>
              </div>
              <p className="mt-4 text-3xl font-bold font-sans tracking-tight text-zinc-900">
                {metrics.hqStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-800">Packets in central warehouse</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-amber-600 shadow-sm">
                  <Package className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">Regional Depots</span>
              </div>
              <p className="mt-4 text-3xl font-bold font-sans tracking-tight text-zinc-900">
                {metrics.warehouseStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-800">Packets in district storage</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white p-2.5 text-[#156035] shadow-sm">
                  <PackageCheck className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">Seller Handover</span>
              </div>
              <p className="mt-4 text-3xl font-bold font-sans tracking-tight text-zinc-900">
                {metrics.sellerStock.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-zinc-800">Packets ready for retail</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t border-zinc-100 pt-5">
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-[#E61C5D] hover:underline"
            >
              View detailed stock reconciliation &rarr;
            </Link>
            <span className="text-zinc-300">·</span>
            <Link
              href="/admin/inventory/transfers"
              className="text-xs font-bold text-[#156035] hover:underline"
            >
              Transfer packets between depots &rarr;
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Field footprint"
          description="Retail coverage and seller incentive"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-emerald-50 p-2.5 text-[#156035]">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Retailers / Shops</p>
                  <p className="text-xs text-zinc-700">Onboarded customer accounts</p>
                </div>
              </div>
              <span className="text-xl font-bold font-sans tracking-tight text-[#156035]">
                {metrics.totalShops}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-rose-50 p-2.5 text-[#E61C5D]">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Field Sellers</p>
                  <p className="text-xs text-zinc-700">Active distribution agents</p>
                </div>
              </div>
              <span className="text-xl font-bold font-sans tracking-tight text-[#E61C5D]">
                {metrics.totalSellers}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Incentives Earned</p>
                  <p className="text-xs text-zinc-700">Calculated on confirmed sales</p>
                </div>
              </div>
              <span className="text-xl font-bold font-sans tracking-tight text-amber-700">
                ₹{metrics.totalIncentiveRupees.toLocaleString("en-IN")}
              </span>
            </div>
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
