"use client";

import { useCallback } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { DashboardShell, PageHeading } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import { useAuth } from "@/context/AuthContext";
import { canManageSellers } from "@/lib/permissions";

export default function ManagerSellersPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";
  const canManage = canManageSellers(user);

  const fetchSellers = useCallback(async (): Promise<ResourceRow[]> => {
    if (!canManage) return [];
    const res = await managerApi.listSellers({ pageSize: 100 });
    const sellers = res?.sellers ?? (res as any)?.items ?? [];
    return sellers.map((s) => ({
      id: s.id,
      name: s.name,
      location: [s.village, s.district].filter(Boolean).join(", ") || "Territory Field",
      phone: s.phone || "—",
      customers: s._count?.customers?.toString() || "0",
      packets: s.stockLocation ? String(s.stockLocation.balance) : "0",
      status: s.active ? "Active" : "Inactive",
    }));
  }, [canManage]);

  if (!canManage) {
    return (
      <DashboardShell
        role="Manager"
        workspace="Manager workspace"
        userName={userName}
        userDetail={userDetail}
        navigation={getManagerNavigation(user)}
      >
        <PageHeading
          eyebrow="Access control"
          title="Field Officers"
          description="Supervise field officers assigned to your territory."
        />
        <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-[#E61C5D] mb-4">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Access Restricted</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Your Super Admin has not assigned officer management permissions to your account.
            If your role requires supervising field sales personnel, contact your head office administrator.
          </p>
          <div className="mt-6">
            <Link
              href="/manager"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c91550] transition cursor-pointer"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <ResourceListScreen
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={getManagerNavigation(user)}
      eyebrow="Assigned team"
      title="Field Officers"
      description="Supervise field officers assigned to your territory. Monitor customer coverage and packet balances."
      primaryAction={canManage ? "Onboard Officer" : undefined}
      primaryHref={canManage ? "/manager/sellers/new" : undefined}
      searchPlaceholder="Search officers by name, village, or phone"
      columns={[
        { key: "name", label: "Field Officer" },
        { key: "location", label: "Location" },
        { key: "phone", label: "Phone" },
        { key: "customers", label: "Customers" },
        { key: "packets", label: "Current stock" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchSellers}
    />
  );
}
