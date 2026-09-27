const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Input props
content = content.replace(
  '  name?: string;\n}) {',
  '  name?: string;\n  onBlur?: () => void;\n}) {'
);
content = content.replace(
  '  placeholder = "",\n  name,\n}: {',
  '  placeholder = "",\n  name,\n  onBlur,\n}: {'
);
content = content.replace(
  '      onBlur={(e) => {\n        e.target.style.borderColor = "var(--color-border)";\n      }}',
  '      onBlur={(e) => {\n        e.target.style.borderColor = "var(--color-border)";\n        if (onBlur) onBlur();\n      }}'
);

// 2. Add onBlur to Cost rate Input in StaffRow
content = content.replace(
  'onChange={(v) => setRow((p) => ({ ...p, costRatePerHour: v }))}',
  'onChange={(v) => setRow((p) => ({ ...p, costRatePerHour: v }))}\n        onBlur={() => onSave(user.id, { role: row.role, costRatePerHour: parseFloat(row.costRatePerHour) || 0 })}'
);

// We can now even REMOVE the Save button from the Action buttons since Role and Cost auto-save, and everything else is in Edit modal!
// But wait, the Save button is harmless to keep, some users prefer explicit saving. So I will keep it just in case.

fs.writeFileSync(filePath, content, 'utf8');
console.log("Added onBlur to Input and auto-save for costRatePerHour");
