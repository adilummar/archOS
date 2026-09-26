const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/[firmId]/page.tsx', 'utf8');

c = c.replace(/\[resolvedParams\.firmId\]/, '[resolvedParams?.firmId]');

fs.writeFileSync('src/app/super-admin/firms/[firmId]/page.tsx', c);
console.log("Patched deps");
