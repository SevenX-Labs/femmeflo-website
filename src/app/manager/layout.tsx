import { RoleGuard } from "@/components/auth/RoleGuard";

export default function ManagerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGuard role="MANAGER" loginPath="/manager/auth/login">{children}</RoleGuard>;
}