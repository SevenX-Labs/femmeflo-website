import { RoleLoginScreen } from "@/components/RoleLoginScreen";

export default function ManagerLoginPage() {
  return (
    <RoleLoginScreen
      role="Manager"
      subtitle="Onboard sellers, support customers, and stay close to the activity across your assigned territory."
      dashboardHref="/manager"
    />
  );
}
