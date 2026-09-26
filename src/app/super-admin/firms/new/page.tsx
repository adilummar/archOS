"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFirmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{slug: string, password: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      adminName: formData.get("adminName"),
      planType: formData.get("planType"),
      adminEmail: formData.get("adminEmail"),
    };

    const res = await fetch("/api/v1/platform/firms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error || "Failed to create firm");
    } else {
      setSuccessData({ slug: body.data.slug, password: body.data._tempAdminPassword });
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl bg-surface border border-border p-8 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-4 text-green-600">Firm Provisioned Successfully!</h1>
        <p className="mb-6 text-muted">Please provide the following temporary credentials to the Firm Admin. They will be forced to change this password on their first login.</p>
        
        <div className="bg-canvas p-6 rounded border border-border mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-border">
            <span className="text-muted">Workspace URL:</span>
            <span className="col-span-2 font-mono font-medium">{window.location.origin}/{successData.slug}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <span className="text-muted">Temporary Password:</span>
            <span className="col-span-2 font-mono font-medium text-lg text-primary">{successData.password}</span>
          </div>
        </div>
        
        <button onClick={() => router.push("/super-admin/firms")} className="px-4 py-2 bg-accent text-white rounded font-medium hover:bg-accent-muted transition-colors">
          Back to Firms
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Provision New Firm</h1>
      {error && <div className="mb-4 p-3 bg-danger/10 text-danger rounded border border-danger/20">{error}</div>}
      
      <form onSubmit={handleSubmit} className="bg-surface border border-border p-6 rounded-lg shadow-sm flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-medium mb-4 pb-2 border-b border-border">Firm Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Firm Name *</label>
              <input name="name" required className="p-2 border border-border rounded bg-canvas text-primary" />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs text-muted font-medium">Subscription Plan *</label>
              <select name="planType" required className="p-2 border border-border rounded bg-canvas text-primary">
                <option value="starter">Starter (PM, Tasks, Staff, Attendance)</option>
                <option value="professional">Professional (All MVP features)</option>
                <option value="enterprise">Enterprise (All MVP features)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Firm Email *</label>
              <input name="email" type="email" required className="p-2 border border-border rounded bg-canvas text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Firm Phone</label>
              <input name="phone" className="p-2 border border-border rounded bg-canvas text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Firm Address</label>
              <input name="address" className="p-2 border border-border rounded bg-canvas text-primary" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4 pb-2 border-b border-border">Initial Firm Admin</h2>
          <p className="text-xs text-muted mb-4">This creates the first admin user. They will be invited to set their password.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Admin Name *</label>
              <input name="adminName" required className="p-2 border border-border rounded bg-canvas text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Admin Email *</label>
              <input name="adminEmail" type="email" required className="p-2 border border-border rounded bg-canvas text-primary" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-border rounded text-primary font-medium hover:bg-canvas transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-accent text-white rounded font-medium hover:bg-accent-muted transition-colors disabled:opacity-50">
            {loading ? "Provisioning..." : "Provision Firm & Admin"}
          </button>
        </div>
      </form>
    </div>
  );
}
