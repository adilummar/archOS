"use client";

import { RoleGuard } from "@/components/shared/RoleGuard";

export default function VariationOrdersLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin", "team_lead", "accounts"]}>{children}</RoleGuard>;
}
