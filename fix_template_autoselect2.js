const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Split on CRLF to find the exact bytes
const lines = content.split('\r\n');
const idx = lines.findIndex(l => l.includes('activeTemplateId') && l.includes('useState'));
console.log('Line index:', idx, '→', lines[idx]);

// Insert useEffect after the useState block (line idx+2 is the closing `);\r\n`)
const insertAfter = idx + 2; // after the closing );
const useEffectCode = `
  // Auto-select first template when templates load from DB (store starts empty on mount)
  useEffect(() => {
    if (!activeTemplateId) {
      const first = templates.find((t) => t.firmId === firm?.id);
      if (first) setActiveTemplateId(first.id);
    }
  }, [templates, firm?.id, activeTemplateId]);`;

lines.splice(insertAfter + 1, 0, useEffectCode);
fs.writeFileSync(file, lines.join('\r\n'), 'utf8');
console.log('Inserted useEffect at line', insertAfter + 1);
