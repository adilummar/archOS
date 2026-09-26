const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/[firmId]/page.tsx', 'utf8');
c = c.replace(/fetch\(\`\/api\/v1\/platform\/firms\/\$\{resolvedParams\.firmId\}\`\)/g, 'fetch(`/api/v1/platform/firms/${resolvedParams?.firmId}`)');
fs.writeFileSync('src/app/super-admin/firms/[firmId]/page.tsx', c);
console.log("Patched super-admin firm page");
