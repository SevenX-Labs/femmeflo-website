"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { managerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import { useAuth } from "@/context/AuthContext";
import { canManageSellers } from "@/lib/permissions";

export default function ManagerSellersPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";
  const canManage = canManageSellers(user);

  const fetchSellers = useCallback(async (): Promise<ResourceRow[]> => {
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
  }, []);

  return (
    <ResourceListScreen
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={managerNavigation}
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
