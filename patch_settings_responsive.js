const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', 'utf8');

// 1. Replace the outer wrapper
c = c.replace(
  `        <div
          style={{
            display: "flex",
            minHeight: "calc(100vh - 60px)",
            background: "var(--color-bg-canvas)",
          }}
        >`,
  `        <div className="flex flex-col md:flex-row min-h-[calc(100vh-60px)] bg-canvas">`
);

// 2. Replace the aside
c = c.replace(
  `          <aside
            style={{
              width: 228,
              flexShrink: 0,
              borderRight: "1px solid var(--color-border)",
              padding: "28px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >`,
  `          <aside className="w-full md:w-[228px] shrink-0 border-b md:border-b-0 md:border-r border-border p-4 md:py-7 md:px-3 flex flex-row md:flex-col gap-1 overflow-x-auto whitespace-nowrap hidden-scrollbar">`
);

// 3. Replace the main wrapper
c = c.replace(
  `          <main
            style={{
              flex: 1,
              padding: "28px 36px",
              minWidth: 0,
              maxWidth: 900,
            }}
          >`,
  `          <main className="flex-1 p-4 md:py-7 md:px-9 min-w-0 max-w-[900px]">`
);

// 4. Fix all the 1fr 1fr grids
c = c.replace(/style=\{\{\s*display: "grid",\s*gridTemplateColumns: "1fr 1fr",\s*gap: 16\s*\}\}/g, 'className="grid grid-cols-1 md:grid-cols-2 gap-4"');

// Fix 1fr 1fr 1fr grids if any (Project Templates)
c = c.replace(/style=\{\{\s*display: "grid",\s*gridTemplateColumns: "2fr 1fr 1fr 1fr",\s*gap: 16,\s*alignItems: "center"\s*\}\}/g, 'className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center"');

fs.writeFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', c);
