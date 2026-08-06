"use client";

import { RoleGuard } from "@/components/shared/RoleGuard";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>;
}
