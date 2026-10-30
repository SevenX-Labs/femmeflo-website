"use client";

import { BulkCustomerOnboardingScreen } from "@/components/management/BulkCustomerOnboardingScreen";
import { adminNavigation } from "@/components/management/navigation";

export default function AdminBulkCustomerPage() {
  return (
    <BulkCustomerOnboardingScreen
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
      backHref="/admin/customers"
    />
  );
}
