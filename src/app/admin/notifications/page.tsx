"use client";

import { NotificationsWorkspace } from "@/components/management/NotificationsWorkspace";
import { adminNavigation } from "@/components/management/navigation";

export default function AdminNotificationsPage() {
  return (
    <NotificationsWorkspace
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    />
  );
}
