const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', 'utf8');

c = c.replace(/<aside\s+style=\{\{[\s\S]*?gap: 4,\s*\}\}\s*>/g, '<aside className="w-full md:w-[228px] shrink-0 border-b md:border-b-0 md:border-r border-border p-4 md:py-7 md:px-3 flex flex-row md:flex-col gap-1 overflow-x-auto whitespace-nowrap">');

c = c.replace(/<main\s+style=\{\{[\s\S]*?maxWidth: 900,\s*\}\}\s*>/g, '<main className="flex-1 p-4 md:py-7 md:px-9 min-w-0 max-w-[900px]">');

fs.writeFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', c);
