import { RoleLoginScreen } from "@/components/RoleLoginScreen";

export default function SellerLoginPage() {
  return (
    <RoleLoginScreen
      role="Seller"
      subtitle="Manage customers, record sales, and keep your inventory moving from one simple workspace."
      dashboardHref="/seller"
    />
  );
}
