const fs = require('fs');

const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add name to Input props
content = content.replace(
  '  disabled?: boolean;\n  type?: string;\n  placeholder?: string;\n}) {',
  '  disabled?: boolean;\n  type?: string;\n  placeholder?: string;\n  name?: string;\n}) {'
);
content = content.replace(
  '  placeholder = "",\n}: {',
  '  placeholder = "",\n  name,\n}: {'
);
content = content.replace(
  '      type={type}\n      value={value}',
  '      type={type}\n      name={name}\n      value={value}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Input patched");
