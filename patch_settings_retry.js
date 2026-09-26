const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', 'utf8');

if (!c.includes('Minimum Task Lead Time (days)')) {
  // 1. Add to state
  const stateMatch = /drawingNumberingEnabled: s\?\.drawingNumberingEnabled \?\? true,\r?\n\s*\}\);/g;
  c = c.replace(stateMatch, "drawingNumberingEnabled: s?.drawingNumberingEnabled ?? true,\n      minimumTaskLeadTimeDays: String(liveFirm?.minimumTaskLeadTimeDays ?? 3),\n    });");

  // 2. Add to handleSave
  // Wait, I already added handleSave in patch_settings_auth.js! Let me check if updateFirm is in there!
  if (!c.includes('minimumTaskLeadTimeDays: parseInt(form.minimumTaskLeadTimeDays)')) {
    const saveMatch = /updateFirmSettings\(liveFirm\.id, \{/g;
    // Replace only the first occurrence in PortalSettingsSection? No, there's only one.
    c = c.replace(saveMatch, `updateFirm(liveFirm.id, {\n        minimumTaskLeadTimeDays: parseInt(form.minimumTaskLeadTimeDays) || 3,\n      });\n      const authStore = useAuthStore.getState();\n      if (authStore.firm && authStore.firm.id === liveFirm.id) {\n        useAuthStore.setState({ firm: { ...authStore.firm, minimumTaskLeadTimeDays: parseInt(form.minimumTaskLeadTimeDays) || 3 } });\n      }\n      updateFirmSettings(liveFirm.id, {`);
  }

  // 3. Add to UI
  const row2Index = c.indexOf('{/* Row 2 */}');
  if (row2Index !== -1) {
    const newRow = `
          {/* Row 1.5 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Minimum Task Lead Time (days)</label>
              <input
                type="number"
                min={0}
                value={form.minimumTaskLeadTimeDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, minimumTaskLeadTimeDays: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-input)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--text-sm)",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                Minimum days in advance a task must be assigned. Requires override otherwise.
              </p>
            </div>
            <div></div>
          </div>
          `;
    c = c.slice(0, row2Index) + newRow + c.slice(row2Index);
  }

  // 4. Ensure useFirmStore has updateFirm imported
  c = c.replace('const { firms, updateFirmSettings } = useFirmStore();', 'const { firms, updateFirmSettings, updateFirm } = useFirmStore();');
  
  fs.writeFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', c);
}
