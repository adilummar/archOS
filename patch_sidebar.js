const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

c = c.replace(/interface SidebarProps \{[\s\S]*?\}/, 'interface SidebarProps {\n  firmSlug: string;\n  collapsed: boolean;\n  onToggle: () => void;\n  mobileOpen?: boolean;\n  onCloseMobile?: () => void;\n}');

c = c.replace(/export function Sidebar\(\{ firmSlug, collapsed, onToggle \}: SidebarProps\) \{/, 'export function Sidebar({ firmSlug, collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {');

// The aside needs a className that handles hiding/showing on mobile
// In Next.js with tailwind v4, we can use `fixed inset-y-0 left-0 z-50 transform transition-transform`
// We will replace the style prop with a dynamic one, or just add className.

c = c.replace(/<aside\s+style=\{\{([\s\S]*?)\}\}\s*>/, (match, p1) => {
  return `
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={\`\${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky md:top-0 h-screen z-50 flex flex-col shrink-0 bg-sidebar border-r border-border transition-all duration-300 overflow-hidden\`}
        style={{
          width: collapsed ? 56 : 220,
          minWidth: collapsed ? 56 : 220,
        }}
      >
  `;
});

// Since we replaced the Link click, we should close the mobile menu when a link is clicked
c = c.replace(/href=\{item\.href\}/g, 'href={item.href}\n                      onClick={() => onCloseMobile?.()}');

fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
