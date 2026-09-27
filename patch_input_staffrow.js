const fs = require('fs');

const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Patch Input type
content = content.replace(
  '    type?: string;\n    placeholder?: string;\n  }) {',
  '    type?: string;\n    placeholder?: string;\n    name?: string;\n  }) {'
);
content = content.replace(
  '  type = "text",\n  placeholder = "",\n}: {',
  '  type = "text",\n  placeholder = "",\n  name,\n}: {'
);
content = content.replace(
  '    <input\n      type={type}\n      value={value}',
  '    <input\n      type={type}\n      name={name}\n      value={value}'
);

// Patch StaffRow props
content = content.replace(
  '  onReactivate: (id: string) => void;\n}) {',
  '  onReactivate: (id: string) => void;\n  onChangePassword?: (id: string, name: string) => void;\n}) {'
);
content = content.replace(
  '  onDiscontinue,\n  onReactivate,\n}: {',
  '  onDiscontinue,\n  onReactivate,\n  onChangePassword,\n}: {'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched Input and StaffRow");
