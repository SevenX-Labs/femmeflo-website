"use client";

import { useCallback } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { DashboardShell, PageHeading } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import { useAuth } from "@/context/AuthContext";
import { canOnboardCustomers, canViewCustomers } from "@/lib/permissions";

export default function ManagerCustomersPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";
  const canOnboard = canOnboardCustomers(user);
  const canView = canViewCustomers(user) || canOnboard;

  const fetchCustomers = useCallback(async (): Promise<ResourceRow[]> => {
    if (!canView) return [];
    const res = await managerApi.listCustomers({ pageSize: 100 });
    const customers = res?.customers ?? (res as any)?.items ?? [];
    return customers.map((c) => ({
      id: c.id,
      name: c.shopName,
      contact: c.contactName || c.phone || "—",
      seller: c.seller?.name || "Field Officer",
      village: c.village || "Territory",
      address:
        c.address ||
        [c.shopNumber, c.streetName, c.village, c.district, c.state, c.pincode].filter(Boolean).join(", ") ||
        [c.village, c.district, c.state].filter(Boolean).join(", "),
      category: c.category?.name || "General trade",
      status: c.active ? "Active" : "Inactive",
      photoPath: c.photoPath,
      latitude: c.latitude,
      longitude: c.longitude,
    }));
  }, [canView]);

  if (!canView) {
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
          title="My customers"
          description="Maintain operational visibility over retail shop relationships in your territory."
        />
        <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#156035] mb-4">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Access Restricted</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Your Super Admin has not assigned customer directory or onboarding permissions to your account.
            If your role requires managing retail customer accounts, contact your head office administrator.
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
      eyebrow="Assigned customers"
      title="My customers"
      description="Maintain full operational visibility over retail shop relationships within your assigned territory."
      primaryAction={canOnboard ? "Add customer" : undefined}
      primaryHref={canOnboard ? "/manager/customers/new" : undefined}
      searchPlaceholder="Search assigned customers by shop name, officer, or village"
      columns={[
        { key: "name", label: "Customer / shop" },
        { key: "contact", label: "Contact person" },
        { key: "seller", label: "Field Officer" },
        { key: "village", label: "Village" },
        { key: "category", label: "Category" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchCustomers}
    />
  );
}
