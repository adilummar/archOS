"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

function LeaveRedirect() {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (params?.firmSlug) {
      const q = new URLSearchParams(searchParams?.toString() || "");
      if (!q.has("tab")) {
        q.set("tab", "leave");
      }
      const qs = q.toString();
      router.replace(`/${params.firmSlug}/attendance${qs ? `?${qs}` : ""}`);
    }
  }, [params?.firmSlug, searchParams, router]);

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ height: 40, background: "#111", borderRadius: 8, border: "1px solid #232323" }} />
      <div style={{ height: 180, background: "#111", borderRadius: 8, border: "1px solid #232323" }} />
      <div style={{ height: 120, background: "#111", borderRadius: 8, border: "1px solid #232323" }} />
      <div style={{ height: 200, background: "#111", borderRadius: 8, border: "1px solid #232323" }} />
    </div>
  );
}

export default function LeavePage() {
  return (
    <Suspense fallback={null}>
      <LeaveRedirect />
    </Suspense>
  );
}
