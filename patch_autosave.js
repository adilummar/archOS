const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Auto-save on role change
content = content.replace(
  /onChange=\{\(v\) => setRow\(\(p\) => \(\{ \.\.\.p, role: v as Role \}\)\)\}/g,
  'onChange={(v) => {\n          setRow((p) => ({ ...p, role: v as Role }));\n          onSave(user.id, { role: v as Role, costRatePerHour: parseFloat(row.costRatePerHour) || 0 });\n        }}'
);

// We can also just hide the inline Save button entirely, since they can edit in the Edit Modal and Role auto-saves.
// But we still need Save for the inline costRate.
// Actually, let's keep the Save button, they can click it.

fs.writeFileSync(filePath, content, 'utf8');
console.log("Added auto-save to role dropdown");
