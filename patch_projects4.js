const fs = require('fs');
let p = fs.readFileSync('src/app/[firmSlug]/(app)/projects/page.tsx', 'utf8');

p = p.replace(/const \{ firm, user \} = useAuthStore\(\);\r?\n?/g, '');

fs.writeFileSync('src/app/[firmSlug]/(app)/projects/page.tsx', p);
