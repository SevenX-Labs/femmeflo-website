import { NotificationsWorkspace } from "@/components/management/NotificationsWorkspace";
import { managerNavigation } from "@/components/management/navigation";

export default function ManagerNotificationsPage() {
  return <NotificationsWorkspace role="Manager" workspace="Manager workspace" navigation={managerNavigation} />;
}