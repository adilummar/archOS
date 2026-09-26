
const fs = require("fs");
let content = fs.readFileSync("src/app/[firmSlug]/(app)/settings/page.tsx", "utf8");
content = content.replace(
  /<button onClick=\{onRemove\} style=\{\{ color: "var\(--color-text-muted\)", background: "none", border: "none", cursor: "pointer", padding: 4 \}\}>\\s*<Trash2 size=\{16\} \/>\\s*<\/button>\\s*<\/div>/,
  `<button onClick={onRemove} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 4 }}><Trash2 size={16} /></button></div>`
);
// Well, replace is risky if I do not match exactly.

