const fs = require('fs');
let p = fs.readFileSync('src/app/[firmSlug]/(app)/projects/page.tsx', 'utf8');

p = p.replace(/const \{ user, firm \} = useAuthStore\(\);\r?\n?/g, '');
p = p.replace(
  'const { projects: uiProjects } = useProjectStore();',
  'const { user, firm } = useAuthStore();\n  const { projects: uiProjects } = useProjectStore();'
);

fs.writeFileSync('src/app/[firmSlug]/(app)/projects/page.tsx', p);
