const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/layout.tsx', 'utf8');

c = c.replace(/const \[sidebarCollapsed, setSidebarCollapsed\] = useState\(false\);/, 'const [sidebarCollapsed, setSidebarCollapsed] = useState(false);\n  const [mobileOpen, setMobileOpen] = useState(false);');

c = c.replace(/<Sidebar\s+firmSlug=\{params\.firmSlug\}\s+collapsed=\{sidebarCollapsed\}\s+onToggle=\{\(\) => setSidebarCollapsed\(\(v\) => !v\)\}\s*\/>/, '<Sidebar\n          firmSlug={params.firmSlug}\n          collapsed={sidebarCollapsed}\n          onToggle={() => setSidebarCollapsed((v) => !v)}\n          mobileOpen={mobileOpen}\n          onCloseMobile={() => setMobileOpen(false)}\n        />');

c = c.replace(/<Topbar title=\{pageTitle\} firmSlug=\{params\.firmSlug\} \/>/, '<Topbar title={pageTitle} firmSlug={params.firmSlug} onToggleMobile={() => setMobileOpen(true)} />');

// also change the layout div flex style to tailwind class to ensure min-w-0 works well
c = c.replace(/<div style=\{\{ display: "flex", minHeight: "100vh" \}\}>/, '<div className="flex min-h-screen">');

c = c.replace(/<div style=\{\{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 \}\}>/, '<div className="flex-1 flex flex-col min-w-0 relative">');

fs.writeFileSync('src/app/[firmSlug]/(app)/layout.tsx', c);
