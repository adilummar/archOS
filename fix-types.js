const fs = require('fs');

function fixHooks(file) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/api\.post\(/g, 'api.post<any>(');
  content = content.replace(/api\.patch\(/g, 'api.patch<any>(');
  content = content.replace(/api\.delete\(/g, 'api.delete<any>(');
  fs.writeFileSync(file, content);
}

fixHooks('src/hooks/useProjects.ts');
fixHooks('src/hooks/useTasks.ts');

function fixPage(file) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/s => s\.includes/g, '(s: any) => s.includes');
  fs.writeFileSync(file, content);
}

fixPage('src/app/[firmSlug]/(app)/projects/page.tsx');
