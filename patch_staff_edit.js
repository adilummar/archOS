const fs = require('fs');

const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
content = content.replace(
  'import { addStaffMember, changeStaffPassword } from "@/app/actions/staff.actions";',
  'import { addStaffMember, changeStaffPassword, editStaffMember, suspendStaffMember, unsuspendStaffMember } from "@/app/actions/staff.actions";'
);
content = content.replace(
  'import { Key } from "lucide-react";',
  'import { Key, Edit2 } from "lucide-react";'
);

// 2. Update grid template
content = content.replace(
  /gridTemplateColumns: "auto 1fr 1fr 140px 120px auto"/g,
  'gridTemplateColumns: "auto minmax(220px, 1.5fr) minmax(150px, 1fr) 140px 120px auto"'
);

// 3. Extract and replace StaffRow
const staffRowStart = content.indexOf('function StaffRow({');
const staffRowEnd = content.indexOf('function StaffRolesSection()');
if (staffRowStart !== -1 && staffRowEnd !== -1) {
  let staffRowBlock = content.substring(staffRowStart, staffRowEnd);
  
  // Add onEdit
  staffRowBlock = staffRowBlock.replace(
    'onChangePassword?: (id: string, name: string) => void;',
    'onChangePassword?: (id: string, name: string) => void;\n    onEdit?: (user: User) => void;'
  );
  staffRowBlock = staffRowBlock.replace(
    '  onChangePassword,\n}: {',
    '  onChangePassword,\n  onEdit,\n}: {'
  );

  // Add Edit button
  staffRowBlock = staffRowBlock.replace(
    '<PrimaryButton\n              onClick={() => onDiscontinue(user.id)}',
    `{onEdit && (
              <PrimaryButton
                onClick={() => onEdit(user)}
                icon={<Edit2 size={12} strokeWidth={2} />}
                variant="ghost"
              >
                Edit
              </PrimaryButton>
            )}
            <PrimaryButton
              onClick={() => onDiscontinue(user.id)}`
  );

  content = content.substring(0, staffRowStart) + staffRowBlock + content.substring(staffRowEnd);
}

// 4. Update StaffRolesSection state and handlers
const sectionStart = content.indexOf('function StaffRolesSection()');
const sectionEnd = content.indexOf('function PortalSettingsSection()');
if (sectionStart !== -1 && sectionEnd !== -1) {
  let sectionBlock = content.substring(sectionStart, sectionEnd);

  // Add edit modal state
  sectionBlock = sectionBlock.replace(
    'const [showAddModal, setShowAddModal] = useState(false);',
    'const [showAddModal, setShowAddModal] = useState(false);\n  const [editUser, setEditUser] = useState<User | null>(null);'
  );

  // Replace handlers
  const oldHandlers = `const handleSave = (id: string, patch: { role: Role; costRatePerHour: number }) => {
    updateUser(id, patch);
    toast("Staff member updated", "success");
  };

  const handleDiscontinue = (id: string) => {
    discontinueUser(id);
    toast("Staff member discontinued", "warning");
  };

  const handleReactivate = (id: string) => {
    updateUser(id, { status: "active", discontinuedAt: undefined });
    toast("Staff member reactivated", "success");
  };`;

  const newHandlers = `const handleSave = async (id: string, patch: { role?: Role; costRatePerHour?: number }) => {
    try {
      await editStaffMember(id, patch);
      updateUser(id, patch);
      toast("Staff member updated", "success");
    } catch (e: any) {
      toast(e.message || "Failed to update", "error");
    }
  };

  const handleDiscontinue = async (id: string) => {
    try {
      await suspendStaffMember(id);
      discontinueUser(id);
      toast("Staff member discontinued", "warning");
    } catch (e: any) {
      toast(e.message || "Failed to discontinue", "error");
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await unsuspendStaffMember(id);
      updateUser(id, { status: "active", discontinuedAt: undefined });
      toast("Staff member reactivated", "success");
    } catch (e: any) {
      toast(e.message || "Failed to reactivate", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    setActionLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const patch = {
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        role: fd.get("role") as any,
        designation: fd.get("designation") as string,
        costRatePerHour: Number(fd.get("costRatePerHour")) || 0
      };
      await editStaffMember(editUser.id, patch);
      updateUser(editUser.id, patch);
      toast("Profile updated successfully", "success");
      setEditUser(null);
    } catch (err: any) {
      toast(err.message || "Failed to update staff", "error");
    } finally {
      setActionLoading(false);
    }
  };`;

  sectionBlock = sectionBlock.replace(oldHandlers, newHandlers);

  // Pass onEdit to StaffRow active mapping
  sectionBlock = sectionBlock.replace(
    /onChangePassword=\{\(id, name\) => setShowPasswordModal\(\{ id, name \}\)\}\n\s*\/>/g,
    'onChangePassword={(id, name) => setShowPasswordModal({ id, name })}\n              onEdit={(u) => setEditUser(u)}\n            />'
  );

  // Add Edit Modal JSX before closing </div>
  const editModalJSX = `
      {/* ── EDIT STAFF MODAL ── */}
      {editUser && (
        <div style={{ position: "fixed", zIndex: 9999, inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setEditUser(null)} />
          <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-canvas)" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)" }}>Edit Staff Member</h3>
              <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div><FieldLabel>Name</FieldLabel><Input name="name" value={editUser.name} onChange={(v) => setEditUser({...editUser, name: v})} placeholder="Full Name" /></div>
              <div><FieldLabel>Email</FieldLabel><Input name="email" type="email" value={editUser.email} onChange={(v) => setEditUser({...editUser, email: v})} placeholder="email@studio.com" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel>Role</FieldLabel>
                  <select name="role" value={editUser.role} onChange={(e) => setEditUser({...editUser, role: e.target.value as any})} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}>
                    <option value="staff">Staff</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="admin">Admin</option>
                    <option value="accounts">Accounts</option>
                  </select>
                </div>
                <div><FieldLabel>Cost / Hr</FieldLabel><Input name="costRatePerHour" type="number" value={editUser.costRatePerHour || 0} onChange={(v) => setEditUser({...editUser, costRatePerHour: Number(v)})} placeholder="â‚¹" /></div>
              </div>
              <div><FieldLabel>Designation</FieldLabel><Input name="designation" value={editUser.designation || ""} onChange={(v) => setEditUser({...editUser, designation: v})} placeholder="e.g. Senior Architect" /></div>
              <div style={{ marginTop: 8, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setEditUser(null)} style={{ padding: "9px 20px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--color-text-primary)", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ padding: "9px 20px", background: "var(--color-accent)", color: "var(--color-text-inverse)", border: "none", borderRadius: "var(--radius-md)", cursor: actionLoading ? "not-allowed" : "pointer", fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;
  sectionBlock = sectionBlock.replace(
    /    <\/div>\s*  \);\s*\}$/,
    editModalJSX + '\n    </div>\n  );\n}'
  );

  content = content.substring(0, sectionStart) + sectionBlock + content.substring(sectionEnd);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched full edit flow");
