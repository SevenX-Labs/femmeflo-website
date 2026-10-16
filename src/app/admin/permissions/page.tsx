"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Globe,
  Loader2,
  LockKeyhole,
  MapPin,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { ManagerItem } from "@/lib/api/types";
import {
  MANAGER_PERMISSIONS,
  PERMISSION_METADATA,
  syncPermissionAliases,
} from "@/lib/permissions";

type ScopeMode = "specific" | "overall";

export default function AdminPermissionsPage() {
  const [permissionsList, setPermissionsList] = useState<string[]>([]);
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("specific");
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [overallPermissions, setOverallPermissions] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");

  const selectedManager = useMemo(
    () => managers.find((m) => m.id === selectedManagerId),
    [managers, selectedManagerId]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [permRes, mgrRes] = await Promise.all([
        adminApi.listPermissions(),
        adminApi.listManagers({ pageSize: 100 }),
      ]);

      const rawPerms: string[] = permRes?.permissions ?? [];
      const functionalPerms = rawPerms.filter(
        (p) =>
          !["SELLER_READ", "SELLER_CREATE", "CUSTOMER_READ", "CUSTOMER_CREATE", "SALES_READ", "INVENTORY_READ", "manage_managers", "manage_permissions"].includes(p)
      );
      const permsToUse = functionalPerms.length > 0 ? functionalPerms : Array.from(MANAGER_PERMISSIONS);
      setPermissionsList(permsToUse);

      const mgrList: ManagerItem[] = mgrRes?.managers ?? (mgrRes as any)?.items ?? [];
      setManagers(mgrList);

      if (mgrList.length > 0) {
        const initialMgr = selectedManagerId
          ? mgrList.find((m) => m.id === selectedManagerId) || mgrList[0]
          : mgrList[0];

        setSelectedManagerId(initialMgr.id);
        const active = (initialMgr.permissions || []).filter((p: string) =>
          permsToUse.includes(p)
        );
        setActivePermissions(active);
        setOverallPermissions(active);
      } else {
        setSelectedManagerId("");
        setActivePermissions([]);
        setOverallPermissions([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load permissions from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectManager = (id: string) => {
    setSelectedManagerId(id);
    const mgr = managers.find((m) => m.id === id);
    if (mgr) {
      const active = (mgr.permissions || []).filter((p) => permissionsList.includes(p));
      setActivePermissions(active);
    }
  };

  const handleScopeChange = (mode: ScopeMode) => {
    setScopeMode(mode);
    if (mode === "specific") {
      const mgr = managers.find((m) => m.id === selectedManagerId) || managers[0];
      if (mgr) {
        setSelectedManagerId(mgr.id);
        const active = (mgr.permissions || []).filter((p) => permissionsList.includes(p));
        setActivePermissions(active);
      }
    } else {
      setActivePermissions(overallPermissions);
    }
  };

  const togglePermission = (perm: string) => {
    setActivePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleEnableAll = () => {
    setActivePermissions([...permissionsList]);
  };

  const handleDisableAll = () => {
    setActivePermissions([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setNotice("");

    const payloadPermissions = syncPermissionAliases(activePermissions);

    try {
      if (scopeMode === "overall") {
        await adminApi.updateOverallPermissions(payloadPermissions);
        setManagers((prev) =>
          prev.map((m) => ({
            ...m,
            permissions: payloadPermissions,
          }))
        );
        setOverallPermissions(activePermissions);
        setNotice(`Universal permissions saved across all ${managers.length} regional managers.`);
      } else {
        if (!selectedManagerId) {
          throw new Error("Select a manager profile first.");
        }
        await adminApi.updateManagerPermissions(selectedManagerId, payloadPermissions);
        setManagers((prev) =>
          prev.map((m) =>
            m.id === selectedManagerId ? { ...m, permissions: payloadPermissions } : m
          )
        );
        const mgrName = selectedManager?.name || "Manager";
        const territory = selectedManager?.district || "Territory";
        setNotice(`Permissions saved successfully for ${mgrName} (${territory}).`);
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Failed to update permissions on backend.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotice(""), 4000);
    }
  };

  const activeCount = activePermissions.length;
  const totalCount = permissionsList.length;

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Access control & RBAC"
        title="Permissions"
        description="Configure permissions between Admin and Regional Managers. Set granular capabilities for specific manager profiles or enforce overall across all managers."
        action={
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh permissions from backend"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || (scopeMode === "specific" && !selectedManagerId)}
              className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-xl bg-[#E61C5D] px-4 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#c91550] transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{scopeMode === "overall" ? "Apply to All Managers" : "Save Permissions"}</span>
            </button>
          </div>
        }
      />

      {/* Scope Mode Control */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900">Application Scope</h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Select whether permissions apply to an individual manager profile or overall to all managers.
            </p>
          </div>

          {/* Scope Mode Switcher */}
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-xs font-bold text-zinc-600 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleScopeChange("specific")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                scopeMode === "specific"
                  ? "bg-white text-zinc-900 shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-[#E61C5D]" />
              <span>Specific Manager</span>
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange("overall")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                scopeMode === "overall"
                  ? "bg-[#156035] text-white shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Overall (All Managers)</span>
            </button>
          </div>
        </div>

        {/* Scope Status & Manager Selector */}
        <div className="mt-4 pt-4 border-t border-zinc-100">
          {scopeMode === "specific" ? (
            managers.length > 0 ? (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Select Target Manager
                    </label>
                    <div className="relative">
                      <select
                        value={selectedManagerId}
                        onChange={(e) => handleSelectManager(e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-3.5 pr-10 text-xs sm:text-sm font-semibold text-zinc-800 focus:border-[#E61C5D] focus:outline-none"
                      >
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — {m.district || m.state || "Territory Scope"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    </div>
                  </div>

                  {selectedManager && (
                    <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          {selectedManager.name}
                        </span>
                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#E61C5D] border border-rose-100">
                          Specific Scope
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-600 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-400" />
                          {[selectedManager.district, selectedManager.state].filter(Boolean).join(", ") || "Territory"}
                        </span>
                        {selectedManager.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-zinc-400" />
                            {selectedManager.phone}
                          </span>
                        )}
                        {selectedManager.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-zinc-400" />
                            {selectedManager.email}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs">
                <div>
                  <p className="font-bold text-amber-900">No Regional Managers Registered</p>
                  <p className="text-amber-700 mt-0.5">
                    There are currently no manager accounts in the system. Onboard a manager profile first to set specific permissions.
                  </p>
                </div>
                <Link
                  href="/admin/managers/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E61C5D] px-3.5 py-2 font-bold text-white hover:bg-[#c91550] transition shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Onboard Manager</span>
                </Link>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-900">
                <Globe className="h-4 w-4 text-[#156035] shrink-0" />
                <span className="font-medium">
                  <strong>Overall Scope Active:</strong> Permissions configured below will be applied universally across all{" "}
                  <strong>{managers.length} regional managers</strong>.
                </span>
              </div>
              <span className="shrink-0 rounded-md bg-[#156035] px-2.5 py-1 text-[11px] font-bold text-white">
                All Managers Policy
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Permissions Configuration List */}
      <div className="mt-6">
        <SectionCard
          title="Permissions"
          description={`${activeCount} of ${totalCount} capabilities active for ${
            scopeMode === "specific" ? (selectedManager?.name || "selected manager") : "all managers"
          }`}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnableAll}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-[#156035] hover:bg-emerald-50 transition"
              >
                Enable All
              </button>
              <span className="text-zinc-300">|</span>
              <button
                type="button"
                onClick={handleDisableAll}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition"
              >
                Disable All
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {permissionsList.map((perm) => {
              const enabled = activePermissions.includes(perm);
              const meta = PERMISSION_METADATA[perm];
              const label = meta?.label || perm.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              const description = meta?.description || ("Permission key: " + perm);

              return (
                <div
                  key={perm}
                  onClick={() => togglePermission(perm)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition cursor-pointer select-none ${
                    enabled
                      ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 hover:bg-emerald-50/30"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600 font-bold">
                        {perm}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                        {label}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-600">
                      {description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                      {enabled ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#156035]">
                          <Check className="h-3 w-3 stroke-[3]" />
                          <span>Active in manager panel</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-zinc-500">
                          <LockKeyhole className="h-3 w-3" />
                          <span>Off (Hidden in manager panel)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="sm:self-center shrink-0 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    <span className="sm:hidden text-xs font-semibold text-zinc-500">
                      {enabled ? "Active" : "Off"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePermission(perm);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enabled ? "bg-[#156035]" : "bg-zinc-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Error Alert */}
      {error && (
        <div role="alert" className="mt-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#B4234D]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notice Toast */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-60 flex items-center gap-2.5 rounded-xl bg-[#156035] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <Check className="h-4 w-4 stroke-[3]" />
          <span>{notice}</span>
        </div>
      )}
    </DashboardShell>
  );
}
