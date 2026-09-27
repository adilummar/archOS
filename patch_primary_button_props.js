const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update PrimaryButton types
content = content.replace(
  /disabled\?: boolean;\r?\n\}\) \{/g,
  'disabled?: boolean;\n  iconOnly?: boolean;\n  title?: string;\n}) {'
);
content = content.replace(
  /disabled = false,\r?\n\}: \{/g,
  'disabled = false,\n  iconOnly = false,\n  title,\n}: {'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched PrimaryButton props");
