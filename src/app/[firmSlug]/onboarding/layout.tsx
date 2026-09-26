"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { ToastProvider } from "@/components/shared/Toast";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const { user, firm } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && (!user || !firm)) {
      router.replace(`/${params.firmSlug}/login`);
    } else if (mounted && firm?.onboardingState === "COMPLETED") {
      router.replace(`/${params.firmSlug}/dashboard`);
    }
  }, [user, firm, mounted, params.firmSlug, router]);

  if (!mounted || !user || !firm || firm.onboardingState === "COMPLETED") {
    return <div className="min-h-screen bg-canvas" />;
  }

  return (
    <div className="min-h-screen bg-canvas text-primary font-sans">
      <ToastProvider />
      <header className="border-b border-border bg-surface px-8 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg text-accent tracking-wider">ARCH OS</h1>
        <div className="text-sm font-medium text-muted">Workspace Setup</div>
      </header>
      <main className="max-w-3xl mx-auto py-12 px-4">
        {children}
      </main>
    </div>
  );
}
