import { RoleGuard } from "@/components/auth/RoleGuard";

export default function MangerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGuard role="MANAGER" loginPath="/manager/auth/login">{children}</RoleGuard>;
}
