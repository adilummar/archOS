const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

// Add requiredFeature to NavItem interface
c = c.replace(/allowedRoles\?\: Role\[\];/, 'allowedRoles?: Role[];\n  requiredFeature?: string;');

// Update getNavGroups to accept enabledFeatures
c = c.replace(/function getNavGroups\(firmSlug: string\): NavGroup\[\] \{/g, 'function getNavGroups(firmSlug: string, enabledFeatures: string[] = []): NavGroup[] {');

// We'll just replace the whole getNavGroups function with a smart filtered version.
const oldFunc = c.match(/function getNavGroups[\s\S]*?return \([\s\S]*?<aside/)[0]; // Wait, that's dangerous. Let's do it cleaner.
