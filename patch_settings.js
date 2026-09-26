const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', 'utf8');

// Add minimumTaskLeadTimeDays to state
c = c.replace(
  'drawingNumberingEnabled: s?.drawingNumberingEnabled ?? true,\n  });',
  'drawingNumberingEnabled: s?.drawingNumberingEnabled ?? true,\n    minimumTaskLeadTimeDays: String(liveFirm?.minimumTaskLeadTimeDays ?? 3),\n  });'
);

// Add to handleSave
c = c.replace(
  'updateFirmSettings(liveFirm.id, {\n      defaultFileRequestWindowDays:',
  'updateFirm(liveFirm.id, {\n      minimumTaskLeadTimeDays: parseInt(form.minimumTaskLeadTimeDays) || 3,\n    });\n    updateFirmSettings(liveFirm.id, {\n      defaultFileRequestWindowDays:'
);

// Bring updateFirm into scope
c = c.replace(
  'const { firms, updateFirmSettings } = useFirmStore();',
  'const { firms, updateFirmSettings, updateFirm } = useFirmStore();'
);

// Add the UI element below drawingNumberingEnabled row or in Row 1. Let's add it to Row 1.
// In Row 1 we have: defaultFileRequestWindowDays and maxClientSessions. Let's just create a new row after row 1.
const newRow = `
          {/* Row 1.5 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <FieldLabel>Minimum Task Lead Time (days)</FieldLabel>
              <input
                type="number"
                min={0}
                value={form.minimumTaskLeadTimeDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, minimumTaskLeadTimeDays: e.target.value }))
                }
                style={numberInputStyle}
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

c = c.replace(
  '            {/* Row 2 */}',
  newRow + '\n            {/* Row 2 */}'
);

fs.writeFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', c);
