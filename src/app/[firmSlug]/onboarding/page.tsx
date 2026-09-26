"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";

export default function OnboardingWizard() {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const { user, firm, login } = useAuthStore();
  const [step, setStep] = useState(0);

  // Step 0 State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 1 State
  const [company, setCompany] = useState({ name: "", phone: "", address: "" });

  // Step 2 & 3 State
  const [leads, setLeads] = useState([{ name: "", email: "" }]);
  const [staff, setStaff] = useState([{ name: "", email: "" }]);
  const [createdUsersInfo, setCreatedUsersInfo] = useState<any[]>([]);

  // Step 4 State
  const [projectName, setProjectName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (firm) {
      setCompany({ name: firm.name, phone: firm.phone || "", address: firm.address || "" });
    }
  }, [firm]);

  const handleStep0 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true); setError("");
    const res = await fetch("/api/v1/onboarding/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to update password");
    } else {
      setStep(1);
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/v1/onboarding/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company)
    });
    setLoading(false);
    if (!res.ok) setError("Failed to update company details");
    else setStep(2);
  };

  const handleStep23 = async (e: React.FormEvent, role: "team_lead" | "staff") => {
    e.preventDefault();
    setLoading(true); setError("");
    const users = (role === "team_lead" ? leads : staff).map(u => ({ ...u, role }));
    const res = await fetch("/api/v1/onboarding/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users })
    });
    setLoading(false);
    if (!res.ok) setError(`Failed to create ${role}`);
    else {
      const data = await res.json();
      if (data.data) {
        setCreatedUsersInfo(prev => [...prev, ...data.data]);
      }
      setStep(role === "team_lead" ? 3 : 4);
    }
  };

  const handleStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName) {
      setLoading(true); setError("");
      await fetch("/api/v1/onboarding/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName })
      });
      setLoading(false);
    }
    setStep(5); // Final summary
  };

  const handleComplete = async () => {
    setLoading(true);
    await fetch("/api/v1/onboarding/complete", { method: "POST" });
    if (user && firm) login(user, { ...firm, onboardingState: "COMPLETED" });
    router.push(`/${params.firmSlug}/dashboard`);
  };

  const renderProgress = () => (
    <div className="flex justify-between items-center mb-8 px-4">
      {["Security", "Company", "Leads", "Staff", "Project"].map((label, idx) => (
        <div key={idx} className="flex flex-col items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= idx ? "bg-accent text-white" : "bg-surface border border-border text-muted"}`}>
            {idx + 1}
          </div>
          <span className={`text-xs font-medium ${step >= idx ? "text-primary" : "text-muted"}`}>{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-8">
      {renderProgress()}
      {error && <div className="mb-6 p-3 bg-danger/10 text-danger rounded border border-danger/20">{error}</div>}

      {step === 0 && (
        <form onSubmit={handleStep0} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2">Secure Your Account</h2>
          <p className="text-muted text-sm mb-4">You are using a temporary password. Please set a new permanent password.</p>
          <input type="password" required placeholder="Temporary Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary" />
          <input type="password" required placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary" />
          <input type="password" required placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary" />
          <button type="submit" disabled={loading} className="mt-4 p-2 bg-accent text-white rounded font-medium hover:bg-accent-muted disabled:opacity-50">Continue</button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={handleStep1} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2">Company Profile</h2>
          <input required placeholder="Firm Name" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} className="p-2 border border-border rounded bg-canvas text-primary" />
          <input placeholder="Phone Number" value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} className="p-2 border border-border rounded bg-canvas text-primary" />
          <input placeholder="Address" value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} className="p-2 border border-border rounded bg-canvas text-primary" />
          <button type="submit" disabled={loading} className="mt-4 p-2 bg-accent text-white rounded font-medium hover:bg-accent-muted disabled:opacity-50">Continue</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={e => handleStep23(e, "team_lead")} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2">Invite Team Leads</h2>
          <p className="text-muted text-sm mb-4">Team leads manage projects and review tasks.</p>
          {leads.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input placeholder="Name" value={l.name} onChange={e => { const n = [...leads]; n[i].name = e.target.value; setLeads(n); }} className="p-2 border border-border rounded bg-canvas text-primary flex-1" />
              <input type="email" placeholder="Email" value={l.email} onChange={e => { const n = [...leads]; n[i].email = e.target.value; setLeads(n); }} className="p-2 border border-border rounded bg-canvas text-primary flex-1" />
            </div>
          ))}
          <button type="button" onClick={() => setLeads([...leads, { name: "", email: "" }])} className="text-accent text-sm font-medium self-start">+ Add Another</button>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setStep(3)} className="p-2 border border-border rounded text-primary flex-1">Skip</button>
            <button type="submit" disabled={loading} className="p-2 bg-accent text-white rounded flex-1">Continue</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={e => handleStep23(e, "staff")} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2">Invite Staff</h2>
          <p className="text-muted text-sm mb-4">Staff members execute tasks.</p>
          {staff.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input placeholder="Name" value={s.name} onChange={e => { const n = [...staff]; n[i].name = e.target.value; setStaff(n); }} className="p-2 border border-border rounded bg-canvas text-primary flex-1" />
              <input type="email" placeholder="Email" value={s.email} onChange={e => { const n = [...staff]; n[i].email = e.target.value; setStaff(n); }} className="p-2 border border-border rounded bg-canvas text-primary flex-1" />
            </div>
          ))}
          <button type="button" onClick={() => setStaff([...staff, { name: "", email: "" }])} className="text-accent text-sm font-medium self-start">+ Add Another</button>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setStep(4)} className="p-2 border border-border rounded text-primary flex-1">Skip</button>
            <button type="submit" disabled={loading} className="p-2 bg-accent text-white rounded flex-1">Continue</button>
          </div>
        </form>
      )}

      {step === 4 && (
        <form onSubmit={handleStep4} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2">First Project</h2>
          <p className="text-muted text-sm mb-4">Set up a project to get started immediately.</p>
          <input placeholder="Project Name (e.g. Skyline Tower)" value={projectName} onChange={e => setProjectName(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary" />
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setStep(5)} className="p-2 border border-border rounded text-primary flex-1">Skip</button>
            <button type="submit" disabled={loading} className="p-2 bg-accent text-white rounded flex-1">Finish</button>
          </div>
        </form>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-green-600 mb-2">All Set!</h2>
          <p className="text-muted text-sm mb-4">Your workspace is ready.</p>
          
          {createdUsersInfo.length > 0 && (
            <div className="bg-canvas p-4 rounded border border-border mb-4 max-h-64 overflow-y-auto">
              <h3 className="font-bold text-sm mb-2 text-primary">Generated Credentials</h3>
              <p className="text-xs text-muted mb-4">Please securely copy these temporary passwords for your invited team members. They will be required to change them on first login.</p>
              <div className="grid gap-2 text-sm">
                {createdUsersInfo.map(u => (
                  <div key={u.id} className="flex justify-between border-b border-border pb-1">
                    <span className="font-medium text-primary">{u.name} ({u.email})</span>
                    <span className="font-mono text-accent">{u.tempPassword}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleComplete} disabled={loading} className="p-2 bg-accent text-white rounded font-medium hover:bg-accent-muted disabled:opacity-50 mt-4">
            {loading ? "Finalizing..." : "Go to Dashboard"}
          </button>
        </div>
      )}
    </div>
  );
}
