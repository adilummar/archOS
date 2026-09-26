const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Topbar.tsx', 'utf8');

c = c.replace(/export function Topbar\(\{ title, firmSlug \}: TopbarProps\) \{/, 'export function Topbar({ title, firmSlug, onToggleMobile }: TopbarProps & { onToggleMobile?: () => void }) {');

const menuButton = `
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleMobile}
          className="md:hidden flex items-center justify-center p-2 mr-2 text-muted hover:text-primary bg-transparent border-none cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
`;

c = c.replace(/<div style=\{\{ display: "flex", alignItems: "center", gap: 12 \}\}>/, `<div style={{ display: "flex", alignItems: "center", gap: 12 }}>\n${menuButton}`);

fs.writeFileSync('src/components/layout/Topbar.tsx', c);
