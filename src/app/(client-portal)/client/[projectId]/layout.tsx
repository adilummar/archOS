"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { PortalHeader } from "@/components/layout/PortalHeader";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const { isPortal, portalSession } = useAuthStore();
  const { projects } = useProjectStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration guard
  if (!mounted) return null;

  // Ensure they are logged in as a client
  if (!isPortal || portalSession?.type !== "client") {
    router.replace("/client/login");
    return null;
  }

  // Ensure the project exists and belongs to this client
  const projectId = params?.projectId;
  const project = projects.find((p) => p.id === projectId);

  if (!project || project.clientId !== portalSession.entityId) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
        <h2>Project not found</h2>
        <p>You don't have access to this project or it doesn't exist.</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--color-bg-canvas)",
    }}>
      <PortalHeader projectId={project.id} />
      <main style={{ flex: 1, position: "relative" }}>
        {children}
      </main>
    </div>
  );
}
