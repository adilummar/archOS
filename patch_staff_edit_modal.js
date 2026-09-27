const fs = require('fs');

const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

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
    </div>
  );
}

function PortalSettingsSection`;

content = content.replace(/    <\/div>\s*  \);\s*\}\s*function PortalSettingsSection/m, editModalJSX);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Injected Edit Modal");
