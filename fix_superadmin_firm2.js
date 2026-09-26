const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/[firmId]/page.tsx', 'utf8');

c = c.replace(/useEffect\(\(\) => \{\n    fetch\(\`\/api\/v1\/platform\/firms\/\$\{resolvedParams\?\.firmId\}\`\)/, `useEffect(() => {
    if (!resolvedParams) return;
    fetch(\`/api/v1/platform/firms/\${resolvedParams.firmId}\`)`);

fs.writeFileSync('src/app/super-admin/firms/[firmId]/page.tsx', c);
console.log("Patched super admin firm UI");
