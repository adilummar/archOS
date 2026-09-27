const fs = require('fs');

const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add required imports at the top
content = content.replace(
  'import { Avatar } from "@/components/shared/Avatar";',
  'import { Avatar } from "@/components/shared/Avatar";\nimport { addStaffMember, changeStaffPassword } from "@/app/actions/staff.actions";\nimport { Key } from "lucide-react";'
);

// 2. Modify StaffRow props
content = content.replace(
  'onReactivate: (id: string) => void;',
  'onReactivate: (id: string) => void;\n  onChangePassword?: (id: string, name: string) => void;'
);
content = content.replace(
  '  onReactivate,\n}: {',
  '  onReactivate,\n  onChangePassword,\n}: {'
);

// 3. Add Change Password button in StaffRow
const staffRowButtons = `
            <PrimaryButton
              onClick={() => onSave(user.id, {
                role: row.role,
                costRatePerHour: parseFloat(row.costRatePerHour) || 0,
              })}
              icon={<Save size={12} strokeWidth={2} />}
              variant="ghost"
            >
              Save
            </PrimaryButton>
            {onChangePassword && (
              <PrimaryButton
                onClick={() => onChangePassword(user.id, user.name)}
                icon={<Key size={12} strokeWidth={2} />}
                variant="ghost"
              >
                Pass
              </PrimaryButton>
            )}
            <PrimaryButton
              onClick={() => onDiscontinue(user.id)}
`;
content = content.replace(
  /<PrimaryButton\s+onClick=\{\(\) =>\s+onSave\(user\.id, \{\s+role: row\.role,\s+costRatePerHour: parseFloat\(row\.costRatePerHour\) \|\| 0,\s+\}\)\s+\}\s+icon=\{<Save size=\{12\} strokeWidth=\{2\} \/>\}\s+variant="ghost"\s*>\s*Save\s*<\/PrimaryButton>\s*<PrimaryButton\s+onClick=\{\(\) => onDiscontinue\(user\.id\)\}/gs,
  staffRowButtons.trim()
);

// 4. Update StaffRolesSection State & Handlers
const staffRolesSectionInit = `
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authFirm) return;
    setActionLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      await addStaffMember({
        firmId: authFirm.id,
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        role: fd.get("role") as any,
        designation: fd.get("designation") as string,
        costRatePerHour: Number(fd.get("costRatePerHour")) || 0
      });
      toast("Staff added successfully", "success");
      setShowAddModal(false);
      window.location.reload();
    } catch (err: any) {
      toast(err.message || "Failed to add staff", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!showPasswordModal || !newPassword) return;
    setActionLoading(true);
    try {
      await changeStaffPassword(showPasswordModal.id, newPassword);
      toast(\`Password changed for \${showPasswordModal.name}\`, "success");
      setShowPasswordModal(null);
      setNewPassword("");
    } catch (err: any) {
      toast(err.message || "Failed to change password", "error");
    } finally {
      setActionLoading(false);
    }
  };
`;
content = content.replace(
  'const [showDiscontinued, setShowDiscontinued] = useState(false);',
  staffRolesSectionInit.trim()
);

// 5. Update title header to include Add Staff Button
const sectionTitleHeader = `
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <SectionTitle>Staff &amp; Roles</SectionTitle>
          <SectionSubtitle>
            Manage team members, their roles, designations, and cost rates.
          </SectionSubtitle>
        </div>
        <PrimaryButton onClick={() => setShowAddModal(true)} icon={<Plus size={14} strokeWidth={2} />}>
          Add Staff Member
        </PrimaryButton>
      </div>
`;
content = content.replace(
  /<div>\s*<SectionTitle>Staff &amp; Roles<\/SectionTitle>\s*<SectionSubtitle>\s*Manage team members, their roles, designations, and cost rates\.\s*<\/SectionSubtitle>/s,
  sectionTitleHeader.trim()
);

// 6. Pass onChangePassword down to StaffRow
content = content.replace(
  /onReactivate=\{handleReactivate\}\s*\/>/g,
  'onReactivate={handleReactivate}\n              onChangePassword={(id, name) => setShowPasswordModal({ id, name })}\n            />'
);

// 7. Inject Modals before the closing </div> of StaffRolesSection
const modals = `
      {/* ── ADD STAFF MODAL ── */}
      {showAddModal && (
        <div style={{ position: "fixed", zIndex: 9999, inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowAddModal(false)} />
          <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-canvas)" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)" }}>Add Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddStaff} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div><FieldLabel>Name</FieldLabel><Input name="name" value={undefined as any} onChange={() => {}} placeholder="Full Name" /></div>
              <div><FieldLabel>Email</FieldLabel><Input name="email" type="email" value={undefined as any} onChange={() => {}} placeholder="email@studio.com" /></div>
              <div><FieldLabel>Password</FieldLabel><Input name="password" type="text" value={undefined as any} onChange={() => {}} placeholder="Temporary Password" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><FieldLabel>Role</FieldLabel><select name="role" style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}><option value="staff">Staff</option><option value="team_lead">Team Lead</option><option value="admin">Admin</option><option value="accounts">Accounts</option></select></div>
                <div><FieldLabel>Cost / Hr</FieldLabel><Input name="costRatePerHour" type="number" value={undefined as any} onChange={() => {}} placeholder="â‚¹" /></div>
              </div>
              <div><FieldLabel>Designation</FieldLabel><Input name="designation" value={undefined as any} onChange={() => {}} placeholder="e.g. Senior Architect" /></div>
              <div style={{ marginTop: 8, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "9px 20px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--color-text-primary)", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ padding: "9px 20px", background: "var(--color-accent)", color: "var(--color-text-inverse)", border: "none", borderRadius: "var(--radius-md)", cursor: actionLoading ? "not-allowed" : "pointer", fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? "Adding..." : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div style={{ position: "fixed", zIndex: 9999, inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => { setShowPasswordModal(null); setNewPassword(""); }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 360, background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-canvas)" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)" }}>Change Password</h3>
              <button onClick={() => { setShowPasswordModal(null); setNewPassword(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                Setting a new password for <strong>{showPasswordModal.name}</strong>.
              </p>
              <div>
                <FieldLabel>New Password</FieldLabel>
                <Input value={newPassword} onChange={setNewPassword} type="text" placeholder="Enter new password" />
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowPasswordModal(null); setNewPassword(""); }} style={{ padding: "8px 16px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--color-text-primary)", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleChangePasswordSubmit} disabled={actionLoading || !newPassword} style={{ padding: "8px 16px", background: "var(--color-accent)", color: "var(--color-text-inverse)", border: "none", borderRadius: "var(--radius-md)", cursor: actionLoading || !newPassword ? "not-allowed" : "pointer", fontWeight: 700, opacity: (actionLoading || !newPassword) ? 0.7 : 1 }}>
                  {actionLoading ? "Saving..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
`;
content = content.replace(
  /    <\/div>\s*  \);\s*}\s*function PortalSettingsSection\(\)/,
  modals + '\n}\n\nfunction PortalSettingsSection()'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patch applied successfully!");
