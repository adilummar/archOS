const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// fix the toast call - res.error doesn't work on the union type
const regex = /toast\(res\.error, "error"\)/;
const replacement = `toast((res as any).error, "error")`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed toast error call');
