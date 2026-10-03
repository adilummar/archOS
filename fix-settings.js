const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

const regex = /[ \t]*<div><\/div>/g;
const replacement = `              <div>
                <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Due Date Warning Limit (days)</label>
                <input
                  type="number"
                  min={1}
                  value={form.priorityPeriodDays}
                  onChange={(e) => setForm((p) => ({ ...p, priorityPeriodDays: e.target.value }))}
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
                  Days before a deadline to show a warning badge on projects/tasks.
                </p>
              </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
