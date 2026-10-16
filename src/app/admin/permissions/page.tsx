"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { ManagerItem } from "@/lib/api/types";

export default function AdminPermissionsPage() {
  const [permissionsList, setPermissionsList] = useState<string[]>([]);
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [activePermissions, setActivePermissions] = useState<string[]>([
  ]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [permRes, mgrRes] = await Promise.all([
        adminApi.listPermissions(),
        adminApi.listManagers().catch(() => ({ managers: [] })),
      ]);

      const permissions = permRes?.permissions ?? [];
      if (permissions.length > 0) {
        setPermissionsList(permissions);
      }

      const managers = mgrRes?.managers ?? (mgrRes as any)?.items ?? [];
      setManagers(managers);
      if (managers.length > 0) {
        setSelectedManagerId(managers[0].id);
        setActivePermissions(managers[0].permissions || []);
      } else {
        setSelectedManagerId("");
        setActivePermissions([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSelectManager = (id: string) => {
    setSelectedManagerId(id);
    const mgr = managers.find((m) => m.id === id);
    if (mgr) {
      setActivePermissions(mgr.permissions || []);
    }
  };

  const togglePermission = (perm: string) => {
    setActivePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const savePermissions = async () => {
    if (!selectedManagerId) return;
    setIsSaving(true);
    setError("");
    try {
      await adminApi.updateManagerPermissions(selectedManagerId, activePermissions);
      setNotice("Manager access permissions saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Unable to save permissions.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotice(""), 3500);
    }
  };

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Access control"
        title="Permissions"
        description="Configure role-based access control (RBAC). Super Admins grant granular permissions to regional Managers."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh permissions"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:border-rose-200 hover:text-[#E61C5D]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              onClick={savePermissions}
              disabled={isSaving || !selectedManagerId}
              className="flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save permissions
            </button>
          </div>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Manager authorization"
          description="Select a regional manager and assign capabilities"
        >
          {managers.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-700">Target Manager Profile</label>
              <select
                value={selectedManagerId}
                onChange={(e) => onSelectManager(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold"
              >
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.district || "Territory Scope"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            {permissionsList.map((permission) => {
              const enabled = activePermissions.includes(permission);
              return (
                <button
                  key={permission}
                  type="button"
                  onClick={() => togglePermission(permission)}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-100 p-3 text-left transition hover:bg-[#FFF8FA]"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
                    <LockKeyhole className="h-4 w-4 text-zinc-700" />
                    {permission}
                  </span>
                  <span
                    className={`flex h-6 w-10 items-center rounded-full p-1 transition ${
                      enabled ? "justify-end bg-[#156035]" : "bg-zinc-200"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Field Officer & Executive Role Scope"
          description="Fixed access rules enforced by the backend API"
        >
          <div className="space-y-2">
            {[
              "Restricted strictly to assigned territory customers",
              "Permitted to record sales inside stock allocation",
              "Real-time visibility into personal packet balance",
              "Personal monthly incentive computation view",
              "Sales transaction history with payment mode filter",
            ].map((rule) => (
              <div key={rule} className="flex items-center justify-between rounded-xl border border-zinc-100 p-3">
                <span className="text-sm font-semibold text-zinc-700">{rule}</span>
                <Check className="h-4 w-4 text-[#157347]" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#B4234D]">{error}</p>}

      {notice && (
        <div className="fixed bottom-6 right-6 z-60 rounded-xl bg-[#156035] px-4 py-3 text-sm font-bold text-white shadow-xl">
          {notice}
        </div>
      )}
    </DashboardShell>
  );
}
