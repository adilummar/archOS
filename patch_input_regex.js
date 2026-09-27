const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /type\?: string;\s*placeholder\?: string;\s*\}/g,
  'type?: string;\n  placeholder?: string;\n  name?: string;\n}'
);

content = content.replace(
  /placeholder = "",\s*\}: \{/g,
  'placeholder = "",\n  name,\n}: {'
);

content = content.replace(
  /<input\s*type=\{type\}\s*value=\{value\}/g,
  '<input\n      type={type}\n      name={name}\n      value={value}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched Input with Regex");
