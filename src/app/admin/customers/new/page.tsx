import { OnboardingFormScreen } from "@/components/management/OnboardingFormScreen";
import { adminNavigation } from "@/components/management/navigation";

export default function AdminAddCustomerPage() {
  return <OnboardingFormScreen role="Super Admin" workspace="Admin workspace" userName="Super Admin" userDetail="Head Office" navigation={adminNavigation} entity="customer" backHref="/admin/customers" />;
}
