const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', 'utf8');

c = c.replace(/<aside\s+style=\{\{[\s\S]*?overflowY: "auto",\s*\}\}\s*>/g, '<aside className="w-full md:w-[228px] shrink-0 border-b md:border-b-0 md:border-r border-border p-4 md:py-7 md:px-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto whitespace-nowrap sticky top-[60px] md:h-[calc(100vh-60px)] z-10 bg-canvas">');

fs.writeFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', c);
