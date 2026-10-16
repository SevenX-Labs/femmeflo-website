"use client";

import { NotificationsWorkspace } from "@/components/management/NotificationsWorkspace";
import { getManagerNavigation } from "@/components/management/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ManagerNotificationsPage() {
  const { user } = useAuth();
  return <NotificationsWorkspace role="Manager" workspace="Manager workspace" navigation={getManagerNavigation(user)} />;
}
