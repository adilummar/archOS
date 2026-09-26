const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/dashboard/page.tsx', 'utf8');

c = c.replace(/<div style=\{\{ display: "grid", gridTemplateColumns: "repeat\(4, 1fr\)", gap: 12 \}\}>/g, '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">');

c = c.replace(/<div style=\{\{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" \}\}>/g, '<div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">');

// also fix skeleton grids
c = c.replace(/<div style=\{\{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 \}\}>/g, '<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">');

c = c.replace(/<div style=\{\{ padding: 28, display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400 \}\}>/g, '<div className="p-4 md:p-7 flex flex-col gap-6 max-w-[1400px]">');

c = c.replace(/<div style=\{\{ padding: 28, display: "flex", flexDirection: "column", gap: 24 \}\}>/g, '<div className="p-4 md:p-7 flex flex-col gap-6">');

fs.writeFileSync('src/app/[firmSlug]/(app)/dashboard/page.tsx', c);
