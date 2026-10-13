import { NotificationsWorkspace } from "@/components/management/NotificationsWorkspace";
import { sellerNavigation } from "@/components/management/navigation";

export default function SellerNotificationsPage() {
  return <NotificationsWorkspace role="Seller" workspace="Seller workspace" navigation={sellerNavigation} />;
}