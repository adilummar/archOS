"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FirmsPage() {
  const [firms, setFirms] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/v1/platform/firms").then(r => {
      if (r.status === 401 || r.status === 403) {
        router.push("/super-admin/login");
        return null;
      }
      return r.json();
    }).then(d => {
      if (d && d.data) setFirms(d.data);
    });
  }, [router]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Firms</h1>
        <Link href="/super-admin/firms/new" className="px-4 py-2 bg-accent text-white rounded font-medium hover:bg-accent-muted transition-colors">
          Create Firm
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-canvas border-b border-border text-muted">
            <tr>
              <th className="p-4 font-medium">Firm Name</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Plan</th>
              <th className="p-4 font-medium">Initial Admin</th>
              <th className="p-4 font-medium">Onboarding</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {firms.map(f => (
              <tr key={f.id} className="hover:bg-canvas transition-colors">
                <td className="p-4 font-medium text-primary">{f.name}</td>
                <td className="p-4 text-muted">{f.slug}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${f.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {f.status}
                  </span>
                </td>
                <td className="p-4 text-muted"><span className="px-2 py-1 bg-surface border border-border rounded text-xs uppercase tracking-wider font-medium">{f.planType || 'unknown'}</span></td>
                <td className="p-4 text-muted">{f.users?.[0]?.email || "None"}</td>
                <td className="p-4 text-muted">{f.onboardingState}</td>
                <td className="p-4">
                  <Link href={`/super-admin/firms/${f.id}`} className="text-accent hover:underline font-medium">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
