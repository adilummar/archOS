const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/layout.tsx', 'utf8');
c = c.replace(
  '<Link href="/super-admin/firms" className="px-3 py-2 rounded hover:bg-accent-muted text-muted hover:text-accent transition-colors">Firms</Link>',
  '<Link href="/super-admin/firms" className="px-3 py-2 rounded hover:bg-accent-muted text-muted hover:text-accent transition-colors">Firms</Link>\n          <Link href="/super-admin/settings" className="px-3 py-2 rounded hover:bg-accent-muted text-muted hover:text-accent transition-colors">Settings</Link>'
);
fs.writeFileSync('src/app/super-admin/layout.tsx', c);
console.log("Patched Super Admin layout");
