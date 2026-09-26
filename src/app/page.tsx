import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-primary flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-surface border border-border p-8 rounded-xl shadow-lg flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-accent tracking-wider mb-2">ARCH OS</h1>
          <p className="text-muted text-sm">Development Directory</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link 
            href="/super-admin/login" 
            className="p-4 border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors group"
          >
            <h2 className="font-bold text-lg group-hover:text-accent transition-colors">Platform Admin</h2>
            <p className="text-sm text-muted mt-1">Manage firms, provision new workspaces, and oversee the platform.</p>
          </Link>

          <Link 
            href="/cda/login" 
            className="p-4 border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors group"
          >
            <h2 className="font-bold text-lg group-hover:text-accent transition-colors">Tenant Workspace (CDA)</h2>
            <p className="text-sm text-muted mt-1">Access the default development firm workspace.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
