"use client";

import { RoleGuard } from "@/components/shared/RoleGuard";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin", "accounts"]}>{children}</RoleGuard>;
}
