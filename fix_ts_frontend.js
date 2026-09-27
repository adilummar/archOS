const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(res && res\.error\) \{/;
const replacement = `if (res && 'error' in res && (res as any).error) {`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed TypeScript error in handleAddStaff');
