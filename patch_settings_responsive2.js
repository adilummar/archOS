const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', 'utf8');

c = c.replace(/<div\s+style=\{\{\s*display: "flex",\s*minHeight: "calc\(100vh - 60px\)",\s*background: "var\(--color-bg-canvas\)",\s*\}\}\s*>/g, '<div className="flex flex-col md:flex-row min-h-[calc(100vh-60px)] bg-canvas">');

c = c.replace(/<aside\s+style=\{\{\s*width: 228,\s*flexShrink: 0,\s*borderRight: "1px solid var\(--color-border\)",\s*padding: "28px 12px",\s*display: "flex",\s*flexDirection: "column",\s*gap: 4,\s*\}\}\s*>/g, '<aside className="w-full md:w-[228px] shrink-0 border-b md:border-b-0 md:border-r border-border p-4 md:py-7 md:px-3 flex flex-row md:flex-col gap-1 overflow-x-auto whitespace-nowrap">');

c = c.replace(/<main\s+style=\{\{\s*flex: 1,\s*padding: "28px 36px",\s*minWidth: 0,\s*maxWidth: 900,\s*\}\}\s*>/g, '<main className="flex-1 p-4 md:py-7 md:px-9 min-w-0 max-w-[900px]">');

// also replace the FirmProfile inline Header row which has max-width
c = c.replace(/<div\s+style=\{\{\s*display: "flex",\s*alignItems: "flex-start",\s*minWidth: 0,\s*maxWidth: 900,\s*\}\}\s*>/g, '<div className="flex flex-col md:flex-row items-start min-w-0 max-w-[900px] gap-4">');

// also replace the Row 1.5 style which I injected as a string earlier
c = c.replace(/<div style=\{\{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 \}\}>/g, '<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">');

fs.writeFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', c);
