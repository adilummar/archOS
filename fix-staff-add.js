const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/staff/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(/await addStaffMember\(\{ \.\.\.addForm, firmId: firm\?\.id \|\| "" \}\);/g, 'await addStaffMut.mutateAsync({ ...addForm, firmId: firm?.id || "" });');

// Ensure load is removed
content = content.replace(/load\(\);\n/g, '');

fs.writeFileSync(file, content);
