const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', 'utf8');

const MODALS = `
      {/* ── ADD STAFF MODAL ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowAddModal(false)} />
          <div style={{ position: "relative", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28, width: 420, zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>Add New Staff</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {([
                { label: "Full Name *", key: "name", type: "text", placeholder: "e.g. Aisha Malik" },
                { label: "Email Address *", key: "email", type: "email", placeholder: "aisha@firm.com" },
                { label: "Designation", key: "designation", type: "text", placeholder: "e.g. Architect" },
                { label: "Phone", key: "phone", type: "text", placeholder: "+91 9876543210" },
              ] as const).map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>{label}</label>
                  <input type={type} value={addForm[key as keyof typeof addForm]} placeholder={placeholder}
                    onChange={(e) => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>Role *</label>
                <select value={addForm.role} onChange={(e) => setAddForm(f => ({ ...f, role: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>
                  <option value="staff">Staff</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="accounts">Accounts</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>Password *</label>
                <div style={{ position: "relative" }}>
                  <input type={showAddPwd ? "text" : "password"} value={addForm.password} placeholder="Min. 6 characters"
                    onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                    style={{ width: "100%", padding: "8px 36px 8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
                  <button onClick={() => setShowAddPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                    {showAddPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button onClick={handleAddStaff} disabled={actionLoading}
                style={{ marginTop: 6, padding: "10px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "Adding..." : "Add Staff Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUSPEND / REINSTATE MODAL ── */}
      {showSuspendModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowSuspendModal(null)} />
          <div style={{ position: "relative", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28, width: 380, zIndex: 1, textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              {showSuspendModal.status === "active"
                ? <ShieldOff size={36} color="#E63946" style={{ margin: "0 auto 10px", display: "block" }} />
                : <ShieldCheck size={36} color="#06D6A0" style={{ margin: "0 auto 10px", display: "block" }} />}
              <h2 style={{ margin: "0 0 6px", fontSize: "var(--text-lg)", fontWeight: 700 }}>
                {showSuspendModal.status === "active" ? "Suspend Staff Member?" : "Reinstate Staff Member?"}
              </h2>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                {showSuspendModal.status === "active"
                  ? showSuspendModal.name + " will lose access immediately."
                  : showSuspendModal.name + " will regain access to the platform."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowSuspendModal(null)} style={{ padding: "9px 20px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--color-text-primary)", fontWeight: 600 }}>Cancel</button>
              <button onClick={handleToggleSuspend} disabled={actionLoading}
                style={{ padding: "9px 20px", background: showSuspendModal.status === "active" ? "#E63946" : "#06D6A0", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: actionLoading ? "not-allowed" : "pointer", fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "Processing..." : (showSuspendModal.status === "active" ? "Yes, Suspend" : "Yes, Reinstate")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => { setShowPasswordModal(null); setNewPassword(""); }} />
          <div style={{ position: "relative", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28, width: 380, zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>Change Password</h2>
              <button onClick={() => { setShowPasswordModal(null); setNewPassword(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
            </div>
            <p style={{ margin: "0 0 14px", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
              Setting a new password for <strong>{showPasswordModal.name}</strong>.
            </p>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input type={showNewPwd ? "text" : "password"} value={newPassword} placeholder="Min. 6 characters"
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%", padding: "8px 36px 8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
                <button onClick={() => setShowNewPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button onClick={handleChangePassword} disabled={actionLoading || !newPassword}
              style={{ marginTop: 14, width: "100%", padding: "10px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: (actionLoading || !newPassword) ? "not-allowed" : "pointer", opacity: (actionLoading || !newPassword) ? 0.7 : 1 }}>
              {actionLoading ? "Saving..." : "Change Password"}
            </button>
          </div>
        </div>
      )}
`;

// Find the line right before the StaffGroup function definition
const lines = c.split('\n');
let insertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('STAFF GROUP') && lines[i].includes('function StaffGroup') === false) {
    insertLine = i;
    break;
  }
}
console.log('Insert before line:', insertLine);
console.log('Line content:', JSON.stringify(lines[insertLine]));

// Insert the modals before the StaffGroup comment
lines.splice(insertLine, 0, MODALS);
fs.writeFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', lines.join('\n'));
console.log('Done');
