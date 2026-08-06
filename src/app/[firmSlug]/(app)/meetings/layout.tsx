"use client";

import { RoleGuard } from "@/components/shared/RoleGuard";

export default function MeetingsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin", "team_lead"]}>{children}</RoleGuard>;
}
