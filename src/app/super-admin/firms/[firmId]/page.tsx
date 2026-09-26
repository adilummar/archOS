"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FirmDetailPage({ params }: { params: Promise<{ firmId: string }> }) {
  const [firm, setFirm] = useState<any>(null);
  const [resolvedParams, setResolvedParams] = useState<{firmId: string} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  useEffect(() => { Promise.resolve(params).then(setResolvedParams); }, [params]);
  useEffect(() => { 
    if (!resolvedParams) return; 
    fetch(`/api/v1/platform/firms/${resolvedParams?.firmId}`)
      .then(r => r.json())
      .then(d => { 
        if (d && d.data) {
          setFirm(d.data);
          setEditData({
            name: d.data.name,
            email: d.data.email,
            phone: d.data.phone || "",
            address: d.data.address || ""
          });
        }
      });
  }, [resolvedParams?.firmId]);

  const toggleStatus = async () => {
    if (!firm) return;
    const newStatus = firm.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this firm?`)) return;

    const res = await fetch(`/api/v1/platform/firms/${firm.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    const d = await res.json();
    if (d.success) {
      setFirm({ ...firm, status: newStatus });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await fetch(`/api/v1/platform/firms/${firm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData)
    });
    const d = await res.json();
    setIsSaving(false);
    if (res.ok && d.data) {
      setFirm({ ...firm, ...editData });
      setIsEditing(false);
    } else {
      alert(d.error || "Failed to update firm");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setIsResetting(true);
    const res = await fetch(`/api/v1/platform/firms/${firm.id}/reset-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPassword })
    });
    setIsResetting(false);
    if (res.ok) {
      alert("Password successfully updated for this user.");
      setResetUserId(null);
      setNewPassword("");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to reset password.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`CRITICAL WARNING: Are you absolutely sure you want to PERMANENTLY delete ${firm.name}? This action cannot be undone and will destroy all tenant data.`)) return;
    
    const confirmName = prompt(`Type "${firm.name}" to confirm deletion:`);
    if (confirmName !== firm.name) {
      alert("Firm name did not match. Deletion cancelled.");
      return;
    }

    const res = await fetch(`/api/v1/platform/firms/${firm.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/super-admin/firms");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete firm");
    }
  };

  if (!firm) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? "Edit Firm" : firm.name}</h1>
        <div className="flex gap-2">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded font-medium border border-border text-primary hover:bg-canvas transition-colors"
            >
              Edit Details
            </button>
          )}
          <button 
            onClick={toggleStatus}
            className={`px-4 py-2 rounded font-medium border transition-colors ${
              firm.status === 'ACTIVE' 
                ? 'border-danger text-danger hover:bg-danger/10' 
                : 'border-green-500 text-green-500 hover:bg-green-500/10'
            }`}
          >
            {firm.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </button>
          <button 
            onClick={handleDelete}
            className="px-4 py-2 rounded font-medium bg-danger text-white hover:bg-danger/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border p-6 rounded-lg shadow-sm grid grid-cols-2 gap-y-6 gap-x-12 mb-6">
        
        {isEditing ? (
          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Firm Name</label>
              <input 
                type="text" 
                value={editData.name} 
                onChange={e => setEditData({...editData, name: e.target.value})}
                className="p-2 border border-border rounded bg-canvas text-primary w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Contact Email</label>
              <input 
                type="email" 
                value={editData.email} 
                onChange={e => setEditData({...editData, email: e.target.value})}
                className="p-2 border border-border rounded bg-canvas text-primary w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Contact Phone</label>
              <input 
                type="text" 
                value={editData.phone} 
                onChange={e => setEditData({...editData, phone: e.target.value})}
                className="p-2 border border-border rounded bg-canvas text-primary w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Address</label>
              <input 
                type="text" 
                value={editData.address} 
                onChange={e => setEditData({...editData, address: e.target.value})}
                className="p-2 border border-border rounded bg-canvas text-primary w-full"
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded font-medium border border-border hover:bg-canvas transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded font-medium bg-accent text-white hover:bg-accent-muted transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Status</label>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${firm.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {firm.status}
              </span>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Workspace Slug</label>
              <div className="text-primary font-medium">{firm.slug}</div>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Subscription Plan</label>
              <select 
                value={firm.planType || "starter"} 
                onChange={async (e) => {
                  const newPlan = e.target.value;
                  const res = await fetch(`/api/v1/platform/firms/${firm.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ planType: newPlan })
                  });
                  if (res.ok) {
                    setFirm({ ...firm, planType: newPlan });
                  }
                }}
                className="p-1 border border-border rounded bg-canvas text-primary uppercase text-sm font-medium cursor-pointer"
              >
                <option value="starter">STARTER</option>
                <option value="professional">PROFESSIONAL</option>
                <option value="enterprise">ENTERPRISE</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Onboarding State</label>
              <div className="text-primary font-medium">{firm.onboardingState}</div>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Created At</label>
              <div className="text-primary font-medium">{new Date(firm.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Address</label>
              <div className="text-primary font-medium">{firm.address || "N/A"}</div>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Contact Email</label>
              <div className="text-primary font-medium">{firm.email}</div>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Contact Phone</label>
              <div className="text-primary font-medium">{firm.phone || "N/A"}</div>
            </div>
          </>
        )}
      </div>

      <h2 className="text-lg font-bold mb-4">Firm Admins</h2>
      <div className="bg-surface border border-border p-6 rounded-lg shadow-sm flex flex-col gap-4">
        {firm.users && firm.users.length > 0 ? (
          firm.users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between p-4 border border-border rounded bg-canvas">
              <div>
                <div className="mb-1"><span className="text-muted text-xs mr-2">Name:</span> <span className="text-primary font-medium">{u.name}</span></div>
                <div className="mb-1"><span className="text-muted text-xs mr-2">Email:</span> <span className="text-primary font-medium">{u.email}</span></div>
                <div><span className="text-muted text-xs mr-2">Role:</span> <span className="text-primary font-medium uppercase text-xs">{u.role}</span></div>
              </div>
              
              <div>
                {resetUserId === u.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="New Password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="p-1 border border-border rounded bg-surface text-sm"
                    />
                    <button 
                      onClick={() => handleResetPassword(u.id)}
                      disabled={isResetting}
                      className="px-3 py-1 bg-accent text-white rounded text-sm font-medium hover:bg-accent-muted disabled:opacity-50"
                    >
                      {isResetting ? "Saving..." : "Save"}
                    </button>
                    <button 
                      onClick={() => setResetUserId(null)}
                      className="px-3 py-1 border border-border rounded text-sm font-medium hover:bg-surface"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setResetUserId(u.id)}
                    className="px-3 py-1 border border-border rounded text-sm font-medium text-primary hover:bg-surface transition-colors"
                  >
                    Change Password
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted">No admins configured.</div>
        )}
      </div>
    </div>
  );
}
