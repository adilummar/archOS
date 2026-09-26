const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/[firmId]/page.tsx', 'utf8');

// I need to add state for the password reset
const stateTarget = `  const [isSaving, setIsSaving] = useState(false);`;
const stateReplacement = `  const [isSaving, setIsSaving] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);`;

c = c.replace(stateTarget, stateReplacement);

// I need to add the reset handler
const handlerTarget = `  const handleDelete = async () => {`;
const handlerReplacement = `  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setIsResetting(true);
    const res = await fetch(\`/api/v1/platform/firms/\${firm.id}/reset-password\`, {
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

  const handleDelete = async () => {`;

c = c.replace(handlerTarget, handlerReplacement);

// I need to update the Initial Admin UI section
const uiTarget = `<h2 className="text-lg font-bold mb-4">Initial Admin</h2>
      <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
        {firm.users && firm.users.length > 0 ? (
          <div>
            <div className="mb-2"><span className="text-muted text-xs mr-2">Name:</span> <span className="text-primary font-medium">{firm.users[0].name}</span></div>
            <div><span className="text-muted text-xs mr-2">Email:</span> <span className="text-primary font-medium">{firm.users[0].email}</span></div>
          </div>
        ) : (
          <div className="text-muted">No admin configured.</div>
        )}
      </div>`;

const uiReplacement = `<h2 className="text-lg font-bold mb-4">Firm Admins</h2>
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
      </div>`;

c = c.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/app/super-admin/firms/[firmId]/page.tsx', c);
console.log("Patched Firm Detail UI for password reset");
