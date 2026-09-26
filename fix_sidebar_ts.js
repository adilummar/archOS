const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

c = c.replace(/interface NavItem \{[\s\S]*?\}/, `interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: Role[];
  requiredFeature?: string;
}`);

fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
console.log("Patched NavItem interface");
