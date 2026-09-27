const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/layout.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\/\/ If no auth in Zustand[\s\S]*?\}, \[user, firm, params\.firmSlug, router\]\);/m;
content = content.replace(regex, '// Client-side redirect removed to prevent race conditions on hard reload.');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched layout.tsx");
