"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/super-admin/login";

  const handleSignOut = async () => {
    await fetch("/api/auth/super-admin/logout", { method: "POST" });
    router.push("/super-admin/login");
  };

  return (
    <div className="flex h-screen bg-canvas text-primary font-sans text-sm">
      {!isLoginPage && (<aside className="w-64 bg-sidebar border-r border-border flex flex-col p-4 shrink-0">
        <div className="mb-8 px-2">
          <h1 className="font-bold text-lg text-accent tracking-wider">ARCH OS <span className="text-xs text-muted">PLATFORM</span></h1>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/super-admin" className="px-3 py-2 rounded hover:bg-accent-muted text-muted hover:text-accent transition-colors">Dashboard</Link>
          <Link href="/super-admin/firms" className="px-3 py-2 rounded hover:bg-accent-muted text-muted hover:text-accent transition-colors">Firms</Link>
          <Link href="/super-admin/settings" className="px-3 py-2 rounded hover:bg-accent-muted text-muted hover:text-accent transition-colors">Settings</Link>
        </nav>
        <button 
          className="text-left px-3 py-2 text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer border-none bg-transparent"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </aside>)}
      <main className={`flex-1 overflow-auto bg-canvas relative ${isLoginPage ? "" : "p-8"}`}>
        {children}
      </main>
    </div>
  );
}
