"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";

export default function AdminManagersPage() {
  const fetchManagers = useCallback(async (): Promise<ResourceRow[]> => {
    const res = await adminApi.listManagers({ pageSize: 100 });
    const managers = res.managers ?? (res as any).items ?? [];
    return managers.map((m) => ({
      id: m.id,
      name: m.name,
      territory: [m.village, m.district, m.state].filter(Boolean).join(", ") || "General Scope",
      phone: m.phone || "—",
      email: m.email || "—",
      sellers: m._count?.sellers?.toString() || "0",
      status: m.active ? "Active" : "Inactive",
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
      eyebrow="People management"
      title="Managers"
      description="Control regional manager access, assigned territory scope, and seller supervisory responsibilities."
      primaryAction="Add manager"
      primaryHref="/admin/managers/new"
      searchPlaceholder="Search by manager name, phone or territory"
      columns={[
        { key: "name", label: "Manager" },
        { key: "territory", label: "Territory" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "sellers", label: "Sellers" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchManagers}
    />
  );
}