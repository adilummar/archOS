const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /onDiscontinue,\s*onReactivate,\s*\}: \{/,
  'onDiscontinue,\n  onReactivate,\n  onChangePassword,\n}: {'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched StaffRow args");
