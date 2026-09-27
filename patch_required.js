const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update Input props to support required
content = content.replace(
  '  onBlur?: () => void;\n}) {',
  '  onBlur?: () => void;\n  required?: boolean;\n}) {'
);
content = content.replace(
  '  name,\n  onBlur,\n}: {',
  '  name,\n  onBlur,\n  required,\n}: {'
);
content = content.replace(
  '      placeholder={placeholder}',
  '      placeholder={placeholder}\n      required={required}'
);

// Update Add Staff Member form inputs to have required
content = content.replace(
  '<Input name="name" value={undefined as any} onChange={() => {}} placeholder="Full Name" />',
  '<Input name="name" value={undefined as any} onChange={() => {}} placeholder="Full Name" required />'
);
content = content.replace(
  '<Input name="email" type="email" value={undefined as any} onChange={() => {}} placeholder="email@studio.com" />',
  '<Input name="email" type="email" value={undefined as any} onChange={() => {}} placeholder="email@studio.com" required />'
);
content = content.replace(
  '<Input name="password" type="text" value={undefined as any} onChange={() => {}} placeholder="Temporary Password" />',
  '<Input name="password" type="text" value={undefined as any} onChange={() => {}} placeholder="Temporary Password" required />'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Added required props");
