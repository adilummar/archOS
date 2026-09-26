const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

c = c.replace(/function getNavGroups\(firmSlug: string\): NavGroup\[\] \{/, `function getNavGroups(firmSlug: string, enabledFeatures: string[] = []): NavGroup[] {`);

fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
console.log("Patched getNavGroups signature");
