"use client";

import { RoleGuard } from "@/components/shared/RoleGuard";

export default function RFILayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin", "team_lead"]}>{children}</RoleGuard>;
}
