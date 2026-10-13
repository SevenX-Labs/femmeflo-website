import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGuard role="SUPER_ADMIN" loginPath="/admin/auth/login">{children}</RoleGuard>;
}